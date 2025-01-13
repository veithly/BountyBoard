import { keccak256, encodeAbiParameters, parseAbiParameters, SignableMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';
import { lineaSepolia, Chain, mantleSepoliaTestnet, mantle, linea, flowMainnet, flowTestnet, bsc, bscTestnet, opBNB, opBNBTestnet } from 'viem/chains';
import monadDevnet from '@/providers/monad';
import anvil from '@/providers/my-anvil';
import contractAddress from '@/constants/contract-address';
import { TaskDetailView } from '@/types/types';
import { AIReviewService } from '@/services/aiReview';
import { headers } from 'next/headers';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_ADDRESS_PRIVATE_KEY as `0x${string}`;

// Supported chain configurations
const SUPPORTED_CHAINS: Record<string, Chain> = {
  'BSC': bsc,
  'BSC Testnet': bscTestnet,
  'opBNB': opBNB,
  'opBNB Testnet': opBNBTestnet,
  'Flow EVM': flowMainnet,
  'Flow EVM Testnet': flowTestnet,
  'Mantle Sepolia Testnet': mantleSepoliaTestnet,
  'Mantle Mainnet': mantle,
  'Linea Mainnet': linea,
  'Linea Sepolia Testnet': lineaSepolia,
  'Anvil': anvil,
  'Monad Devnet': monadDevnet,
};

const aiReviewService = new AIReviewService();

// Get the base URL
function getBaseUrl() {
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  return `https://${host}`;
}

// Verify social account operation
async function verifySocialAction(taskConfig: any, proofData: any) {
  try {
    // If there is no social account task configuration, return true directly
    if (!taskConfig.XFollowUsername &&
        !taskConfig.XLikeId &&
        !taskConfig.XRetweetId &&
        !taskConfig.DiscordChannelId) {
      return true;
    }

    const baseUrl = getBaseUrl();

    // Check if there are Twitter-related tasks
    if (taskConfig.XFollowUsername || taskConfig.XLikeId || taskConfig.XRetweetId) {
      if (!proofData.encryptedTokens || !proofData.xId) {
        throw new Error('Missing Twitter account information');
      }

      // Verify Twitter account
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

    // Verify Discord join
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

    // Validate parameters
    if (!boardId || !taskId || !address || !proof || !chainName || !task) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the configuration for the corresponding chain
    const chain = SUPPORTED_CHAINS[chainName];
    if (!chain) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      );
    }

    const contractAddr = contractAddress.BountyBoard[chain.name as keyof typeof contractAddress.BountyBoard];
    if (!contractAddr) {
      return NextResponse.json(
        { error: 'Contract not deployed on this chain' },
        { status: 400 }
      );
    }

    // Verify if the task allows self-inspection
    if (!task.allowSelfCheck) {
      return NextResponse.json(
        { error: 'Task does not allow self-check' },
        { status: 400 }
      );
    }

    let checkData = 'Check Success';
    const taskConfig = task.config;
    const proofData = JSON.parse(proof);

    // Add social account verification
    try {
      await verifySocialAction(taskConfig, proofData);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Social verification failed' },
        { status: 400 }
      );
    }

    // If AI Review is enabled in the task configuration
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

    // Construct message
    const message = encodeAbiParameters(
      parseAbiParameters('uint256, uint256, address, string'),
      [BigInt(boardId), BigInt(taskId), address as `0x${string}`, checkData]
    );

    // Calculate message hash
    const messageHash = keccak256(message);

    // Validate private key format
    if (!SIGNER_PRIVATE_KEY || !SIGNER_PRIVATE_KEY.startsWith('0x') || SIGNER_PRIVATE_KEY.length !== 66) {
      throw new Error('Invalid SIGNER_PRIVATE_KEY format');
    }

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // Sign the message
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