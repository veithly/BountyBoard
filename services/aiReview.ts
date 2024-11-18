import { Octokit } from '@octokit/rest';
import { SubmissionProof } from '@/types/types';

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
}

interface AIReviewResponse {
  approved: boolean;
  reviewComment: string;
}

export class AIReviewService {
  private async getContentToReview(proofTypes: ProofType[], proofData: SubmissionProof): Promise<string> {
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

              content = `PR Title: ${prData.title}\nPR Description: ${prData.body || ''}`;
            }
            break;

          case 'Contract Verification':
            if (proofData.contract) {
              const response = await fetch(
                `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${proofData.contract}&apikey=${ETHERSCAN_API_KEY}`
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
    const AI_API_URL = 'https://coder.gaia.domains/v1';
    const AI_MODEL = 'coder';
    console.log("Content:", content);

    const response = await fetch(`${AI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a task reviewer. Review all submitted proofs based on the task description and review prompt.
Your response must be a JSON object with two fields:
1. "approved": boolean indicating if ALL submissions meet the requirements
2. "reviewComment": a concise comment (max 100 chars) explaining the review result

Task Description: ${taskDescription}
Review Prompt: ${aiReviewPrompt}`
          },
          {
            role: 'user',
            content: content
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const result = await response.json();
    console.log("AI Response:", result.choices[0]);

    const aiResponse = JSON.parse(result.choices[0].message.content);

    return {
      approved: aiResponse.approved,
      reviewComment: aiResponse.reviewComment.slice(0, 100)
    };
  }

  public async review(request: AIReviewRequest): Promise<AIReviewResponse> {
    try {
      console.log("Reviewing content:", request);
      const content = await this.getContentToReview(request.proofTypes, request.proofData);
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