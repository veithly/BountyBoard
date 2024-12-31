import { keccak256, encodeAbiParameters, parseAbiParameters, SignableMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';
import { lineaSepolia, Chain, mantleSepoliaTestnet, mantle, linea, flowMainnet, flowTestnet } from 'viem/chains';
import anvil from '@/providers/my-anvil';
import contractAddress from '@/constants/contract-address';
import { TaskDetailView } from '@/types/types';
import { AIReviewService } from '@/services/aiReview';
import { headers } from 'next/headers';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_ADDRESS_PRIVATE_KEY as `0x${string}`;

// 支持的链配置
const SUPPORTED_CHAINS: Record<string, Chain> = {
  'Flow EVM': flowMainnet,
  'Flow EVM Testnet': flowTestnet,
  'Mantle Sepolia Testnet': mantleSepoliaTestnet,
  'Mantle Mainnet': mantle,
  'Linea Mainnet': linea,
  'Linea Sepolia Testnet': lineaSepolia,
  'Anvil': anvil,
};

const aiReviewService = new AIReviewService();

// 获取基础 URL
function getBaseUrl() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  return `https://${host}`;
}

// 验证社交账号操作
async function verifySocialAction(taskConfig: any, proofData: any) {
  try {
    // 如果没有社交账号任务配置，直接返回 true
    if (!taskConfig.XFollowUsername &&
        !taskConfig.XLikeId &&
        !taskConfig.XRetweetId &&
        !taskConfig.DiscordChannelId) {
      return true;
    }

    const baseUrl = getBaseUrl();

    // 检查是否有 Twitter 相关任务
    if (taskConfig.XFollowUsername || taskConfig.XLikeId || taskConfig.XRetweetId) {
      if (!proofData.encryptedTokens || !proofData.xId) {
        throw new Error('Missing Twitter account information');
      }

      // 验证 Twitter 账号
      const verifyResponse = await fetch(`${baseUrl}/api/social/twitter/check-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedTokens: proofData.encryptedTokens,
          action: taskConfig.XFollowUsername ? 'follow' :
                 taskConfig.XLikeId ? 'like' :
                 taskConfig.XRetweetId ? 'retweet' : '',
          targetUser: taskConfig.XFollowUsername || '',
          tweetId: taskConfig.XLikeId || taskConfig.XRetweetId || '',
          userId: proofData.xId
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Twitter action verification failed');
      }

      const result = await verifyResponse.json();
      if (!result.verified) {
        throw new Error('Twitter action not verified');
      }
    }

    // 验证 Discord 加入
    if (taskConfig.DiscordChannelId) {
      if (!proofData.encryptedTokens || !proofData.discordId) {
        throw new Error('Missing Discord account information');
      }

      const checkResponse = await fetch(`${baseUrl}/api/social/discord/check-guild`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encryptedTokens: proofData.encryptedTokens,
          guildId: taskConfig.DiscordChannelId,
          userId: proofData.discordId
        })
      });

      if (!checkResponse.ok) {
        throw new Error('Discord guild verification failed');
      }

      const result = await checkResponse.json();
      if (!result.inGuild) {
        throw new Error('Discord guild membership not verified');
      }
    }

    return true;
  } catch (error) {
    console.error('Social verification error:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { boardId, boardConfig, taskId, address, proof, chainName, task } = await req.json();

    // 验证参数
    if (!boardId || !taskId || !address || !proof || !chainName || !task) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 获取对应链的配置
    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      );
    }

    // 获取对应链的合约地址
    const contractAddr = contractAddress.BountyBoard[chain.name as keyof typeof contractAddress.BountyBoard];
    if (!contractAddr) {
      return NextResponse.json(
        { error: 'Contract not deployed on this chain' },
        { status: 400 }
      );
    }

    // 验证任务是否允许自检
    if (!task.allowSelfCheck) {
      return NextResponse.json(
        { error: 'Task does not allow self-check' },
        { status: 400 }
      );
    }

    let checkData = 'Check Success';
    const taskConfig = task.config;
    const proofData = JSON.parse(proof);

    // 添加社交账号验证
    try {
      await verifySocialAction(taskConfig, proofData);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Social verification failed' },
        { status: 400 }
      );
    }

    // 如果任务配置中启用了 AI Review
    if (taskConfig.aiReview) {
      const aiReviewResult = await aiReviewService.review({
        boardConfig,
        taskConfig,
        proofTypes: taskConfig.taskType,
        proofData,
        taskName: task.name,
        taskDescription: task.description,
        aiReviewPrompt: taskConfig.aiReviewPrompt
      });

      if (!aiReviewResult.approved) {
        return NextResponse.json(
          { error: aiReviewResult.reviewComment },
          { status: 400 }
        );
      }

      checkData = aiReviewResult.reviewComment;
    }

    // 构造消息
    const message = encodeAbiParameters(
      parseAbiParameters('uint256, uint256, address, string'),
      [BigInt(boardId), BigInt(taskId), address as `0x${string}`, checkData]
    );

    // 计算消息哈希
    const messageHash = keccak256(message);

    // 验证私钥格式
    if (!SIGNER_PRIVATE_KEY || !SIGNER_PRIVATE_KEY.startsWith('0x') || SIGNER_PRIVATE_KEY.length !== 66) {
      throw new Error('Invalid SIGNER_PRIVATE_KEY format');
    }

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // 签名消息
    const signature = await account.signMessage({
      message: { raw: messageHash } as SignableMessage
    });

    return NextResponse.json({ signature, checkData });
  } catch (error) {
    console.error('Error in self-check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}