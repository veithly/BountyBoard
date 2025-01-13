import { Octokit } from '@octokit/rest';
import { BoardConfig, SubmissionProof, TaskConfig } from '@/types/types';
import { stringToUuid } from "@/lib/uuid";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

const elizaAgentUserId = process.env.ELIZA_AGENT_USER_ID || "";
const elizaAgentId = process.env.ELIZA_AGENT_ID || "";
const elizaAgentUrl = `${process.env.ELIZA_API_URL}/${elizaAgentId}/message`;

export type ProofType = 'Plain Text' | 'Image' | 'Github Pull Request' | 'Contract Verification' | 'X Follow' | 'X Post' | 'Join Discord';

interface AIReviewRequest {
  proofTypes: ProofType[];
  proofData: SubmissionProof;
  taskName: string;
  taskDescription: string;
  aiReviewPrompt: string;
  taskConfig?: TaskConfig;
  boardConfig?: BoardConfig;
}

interface AIReviewResponse {
  approved: boolean;
  reviewComment: string;
}

export class AIReviewService {
  private async getContentToReview(proofTypes: ProofType[], proofData: SubmissionProof, taskConfig?: TaskConfig, boardConfig?: BoardConfig): Promise<string> {
    console.log('Proof Types:', proofTypes);
    console.log('Proof Data:', proofData);
    console.log('Task Config:', taskConfig);

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
              const network = taskConfig?.contractNetwork || 'Flow EVM';

              let apiUrl = '';
              let apiKey = '';

              switch (network) {
                case 'Mantle':
                  apiUrl = 'https://api.mantlescan.xyz/api';
                  apiKey = process.env.MANTLESCAN_API_KEY || '';
                  break;
                case 'Mantle Sepolia':
                  apiUrl = 'https://api-sepolia.mantlescan.xyz/api';
                  apiKey = process.env.MANTLESCAN_API_KEY || '';
                  break;
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
                case 'Flow EVM':
                case 'Flow EVM Testnet':
                  const isTestnet = network === 'Flow EVM Testnet';
                  apiUrl = isTestnet
                    ? 'https://evm-testnet.flowscan.io/api/v2'
                    : 'https://evm.flowscan.io/api/v2';
                  break;
                case 'BSC':
                  apiUrl = 'https://api.bscscan.com/api';
                  apiKey = process.env.BSCSCAN_API_KEY || '';
                  break;
                case 'BSC Testnet':
                  apiUrl = 'https://api-testnet.bscscan.com/api';
                  apiKey = process.env.BSCSCAN_API_KEY || '';
                  break;
                case 'opBNB':
                  apiUrl = 'https://op-bnb-mainnet-explorer-api.nodereal.io/api';
                  break;
                case 'opBNB Testnet':
                  apiUrl = 'https://op-bnb-testnet-explorer-api.nodereal.io/api';
                  break;
                case 'Monad Devnet':
                  apiUrl = 'https://explorer.monad-devnet.devnet101.com/api/v2/';
                  break;
              }

              let content = '';

              if (network.startsWith('Flow EVM') || network.startsWith('Monad')) {
                // BlockScout API 调用
                try {
                  const response = await fetch(
                    `${apiUrl}/smart-contracts/${proofData.contract}`
                  );
                  const data = await response.json();

                  if (data.source_code) {
                    const sourceCode = data.source_code;
                    try {
                      const parsedSource = JSON.parse(sourceCode);
                      content = Object.entries(parsedSource)
                        .filter(([filename]) => !filename.toLowerCase().includes('lib/') &&
                          !filename.toLowerCase().includes("@")
                        )
                        .map(([filename, fileContent]) => {
                          if (typeof fileContent === 'object' && fileContent !== null && 'content' in fileContent) {
                            return `File: ${filename}\n${(fileContent as any).content}`;
                          } else {
                            return `File: ${filename}\n${fileContent}`;
                          }
                        })
                        .join('\n\n');
                    } catch (e) {
                      content = sourceCode;
                    }
                  } else {
                    throw new Error('Contract source code not found');
                  }
                } catch (error: any) {
                  console.error('Error fetching from BlockScout API:', error);
                  throw new Error(`Failed to fetch contract source code: ${error.message}`);
                }
              } else if (network.startsWith('opBNB')) {
                // NodeReal API 调用
                try {
                  // 首先获取合约验证状态
                  const verifyResponse = await fetch(
                    `${apiUrl}/contract/preverify`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify({
                        address: proofData.contract
                      }),
                      redirect: 'follow'
                    }
                  );
                  const verifyData = await verifyResponse.text();
                  const data = JSON.parse(verifyData);

                  if (data.data && data.data.input_json && data.data.input_json.sources) {
                    // 直接从验证数据中获取源代码
                    const sources = data.data.input_json.sources;
                    content = Object.entries(sources)
                      .filter(([filename]) => !filename.toLowerCase().includes('lib/') &&
                        !filename.toLowerCase().includes("@")
                      )
                      .map(([filename, fileContent]: [string, any]) => {
                        if (typeof fileContent === 'object' && fileContent !== null && 'content' in fileContent) {
                          return `File: ${filename}\n${fileContent.content}`;
                        } else {
                          return `File: ${filename}\n${fileContent}`;
                        }
                      })
                      .join('\n\n');
                  } else {
                    throw new Error('Contract source code not found or not verified');
                  }
                } catch (error: any) {
                  console.error('Error fetching from NodeReal API:', error);
                  throw new Error(`Failed to fetch contract source code: ${error.message}`);
                }
              } else {
                // 原有的 Etherscan 风格 API 调用
                const response = await fetch(
                  `${apiUrl}?module=contract&action=getsourcecode&address=${proofData.contract}&apikey=${apiKey || ''}`
                );
                const data = await response.json();
                let sourceCode = data.result[0].SourceCode || '';

                try {
                  const parsedSource = JSON.parse(sourceCode.slice(1, -1));
                  const sources = parsedSource.sources;

                  content = Object.entries(sources)
                    .filter(([filename]) => !filename.toLowerCase().includes('lib/') &&
                      !filename.toLowerCase().includes("@")
                    )
                    .map(([filename, fileContent]) => {
                      if (typeof fileContent === 'object' && fileContent !== null && 'content' in fileContent) {
                        return `File: ${filename}\n${(fileContent as any).content}`;
                      } else {
                        throw new Error(`Invalid file content for ${filename}`);
                      }
                    })
                    .join('\n\n');
                } catch (e) {
                  content = sourceCode;
                }
              }

              if (!content) {
                throw new Error('No source code content found');
              }
              return content;
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

  private async callAIAPI(content: string, taskName: string, taskDescription: string, aiReviewPrompt: string, boardConfig?: BoardConfig): Promise<{ approved: boolean, reviewComment: string }> {
    try {
      const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

      // 构建结构化的提示词
      const prompt = {
        task_info: {
          name: taskName,
          description: taskDescription,
          review_prompt: aiReviewPrompt
        },
        submission_content: content,
        review_instructions: "Review the submission and return a JSON object WITHOUT markdown formatting. The response must be a valid JSON object with the following structure: { decision: 'APPROVED' or 'REJECTED', comment: 'explanation', confidence_score: number between 0 and 1 }",
        example_response: {
          decision: "APPROVED",
          comment: "The submission meets all requirements",
          confidence_score: 0.95
        }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: JSON.stringify(prompt)
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Gemini API response');
      }

      const data = await response.json();
      let result = data.candidates[0].content.parts[0].text;

      // 清理响应文本，移除可能的 markdown 标记
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsedResult = JSON.parse(result);
        const isApproved = parsedResult.decision === 'APPROVED';

        return {
          approved: isApproved,
          reviewComment: parsedResult.comment || (isApproved ? 'Approved' : 'Rejected')
        };
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.log('Raw response:', result);

        // 如果解析失败，尝试使用简单的文本匹配
        const isApproved = result.toLowerCase().includes('approved');
        const comment = result.split('\n').find((line: string) =>
          line.toLowerCase().includes('comment') ||
          line.toLowerCase().includes('explanation')
        ) || 'Review completed';

        return {
          approved: isApproved,
          reviewComment: comment.replace(/^[^:]*:\s*/, '').trim()
        };
      }
    } catch (error) {
      console.error('Error in AI review:', error);
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
        request.taskConfig,
        request.boardConfig
      );
      console.log('Content to review:', content);
      return await this.callAIAPI(
        content,
        request.taskName,
        request.taskDescription,
        request.aiReviewPrompt,
        request.boardConfig
      );
    } catch (error) {
      console.error('AI Review error:', error);
      throw error;
    }
  }
}