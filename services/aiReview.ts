import { Octokit } from '@octokit/rest';
import { SubmissionProof, TaskConfig } from '@/types/types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

export type ProofType = 'Plain Text' | 'Image' | 'Github Pull Request' | 'Contract Verification' | 'X Follow' | 'X Post' | 'Join Discord';

interface AIReviewRequest {
  proofTypes: ProofType[];
  proofData: SubmissionProof;
  taskDescription: string;
  aiReviewPrompt: string;
  taskConfig?: TaskConfig;
}

interface AIReviewResponse {
  approved: boolean;
  reviewComment: string;
}

export class AIReviewService {
  private async getContentToReview(proofTypes: ProofType[], proofData: SubmissionProof, taskConfig?: TaskConfig): Promise<string> {
    const contents: string[] = [];

    for (const proofType of proofTypes) {
      try {
        let content = '';
        switch (proofType) {
          case 'Plain Text':
            content = proofData.text || '';
            break;

          case 'Image':
            content = proofData.image || '';
            break;

          case 'Github Pull Request':
            if (proofData.github) {
              const prUrl = proofData.github;
              const [owner, repo, , prNumber] = prUrl.split('/').slice(-4);

              const { data: prData } = await octokit.pulls.get({
                owner,
                repo,
                pull_number: parseInt(prNumber)
              });

              const { data: files } = await octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: parseInt(prNumber)
              });

              const fileContents = await Promise.all(
                files.map(async (file) => {
                  if (file.status === 'removed') {
                    return `File: ${file.filename}\nStatus: Removed`;
                  }

                  try {
                    const { data: fileData } = await octokit.repos.getContent({
                      owner,
                      repo,
                      path: file.filename,
                      ref: prData.head.sha
                    });

                    if (typeof fileData === 'object' && 'content' in fileData) {
                      const content = Buffer.from(fileData.content, 'base64').toString();
                      return `File: ${file.filename}
Status: ${file.status}
Changes: ${file.additions} additions, ${file.deletions} deletions
Content:
\`\`\`
${content}
\`\`\`
`;
                    }
                    return `File: ${file.filename}\nStatus: ${file.status} (Binary file or too large)`;
                  } catch (error) {
                    console.error(`Error fetching content for ${file.filename}:`, error);
                    return `File: ${file.filename}\nStatus: ${file.status}\nError: Failed to fetch content`;
                  }
                })
              );

              content = `PR Title: ${prData.title}
PR Description: ${prData.body || 'No description provided'}
PR State: ${prData.state}
PR Branch: ${prData.head.ref} -> ${prData.base.ref}
Changed Files:
${fileContents.join('\n\n')}`;
            }
            break;

          case 'Contract Verification':
            if (proofData.contract) {
              const network = taskConfig?.contractNetwork || 'Linea';

              let apiUrl = '';
              let apiKey = '';

              switch (network) {
                case 'Linea':
                  apiUrl = 'https://api.lineascan.build/api';
                  apiKey = process.env.LINEASCAN_API_KEY || '';
                  break;
                case 'Linea Sepolia':
                  apiUrl = 'https://api-sepolia.lineascan.build/api';
                  apiKey = process.env.LINEASCAN_API_KEY || '';
                  break;
                case 'Ethereum':
                  apiUrl = 'https://api.etherscan.io/api';
                  apiKey = process.env.ETHERSCAN_API_KEY || '';
                  break;
                case 'Sepolia':
                  apiUrl = 'https://api-sepolia.etherscan.io/api';
                  apiKey = process.env.ETHERSCAN_API_KEY || '';
                  break;
              }

              const response = await fetch(
                `${apiUrl}?module=contract&action=getsourcecode&address=${proofData.contract}&apikey=${apiKey}`
              );
              const data = await response.json();
              content = data.result[0].SourceCode || '';
            }
            break;

          default:
            console.warn(`Unsupported proof type: ${proofType}`);
            continue;
        }

        if (content) {
          contents.push(`${proofType}: ${content}`);
        }
      } catch (error) {
        console.error(`Error processing ${proofType}:`, error);
        throw new Error(`Failed to process ${proofType}`);
      }
    }

    if (contents.length === 0) {
      throw new Error('No valid proof content found');
    }

    return contents.join('\n\n');
  }

  private async callAIAPI(content: string, taskDescription: string, aiReviewPrompt: string): Promise<{ approved: boolean, reviewComment: string }> {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    const response = await fetch(`${API_URL}?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a task reviewer. Review all submitted proofs based on the task description and review prompt.
Please respond with a clean JSON object (no markdown formatting) containing:
1. "approved": boolean indicating if ALL submissions meet the requirements
2. "reviewComment": a concise comment (max 100 chars) explaining the review result

Task Description: ${taskDescription}
Review Prompt: ${aiReviewPrompt}

Submission Content:
${content}`
          }]
        }]
      })
    });

    const result = await response.json();
    try {
      const responseContent = result.candidates[0].content.parts[0].text;
      const cleanContent = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // 解析 JSON
      const aiResponse = JSON.parse(cleanContent);

      // 验证响应格式
      if (typeof aiResponse.approved !== 'boolean' || typeof aiResponse.reviewComment !== 'string') {
        throw new Error('Invalid AI response format');
      }

      return {
        approved: aiResponse.approved,
        reviewComment: aiResponse.reviewComment.slice(0, 100)
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        approved: false,
        reviewComment: 'Error processing AI review response'
      };
    }
  }

  public async review(request: AIReviewRequest): Promise<AIReviewResponse> {
    try {
      const content = await this.getContentToReview(
        request.proofTypes,
        request.proofData,
        request.taskConfig
      );
      return await this.callAIAPI(
        content,
        request.taskDescription,
        request.aiReviewPrompt
      );
    } catch (error) {
      console.error('AI Review error:', error);
      throw error;
    }
  }
}