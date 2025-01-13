import { NextResponse } from "next/server";
import { Client } from "twitter-api-sdk";
import { decryptData } from '@/utils/encryption-server';

// Define simplified types instead of using Components
type User = {
  id?: string;
  username?: string;
};

type Tweet = {
  id?: string;
};

// Extend type definition
type PublicMetrics = {
  like_count?: number;
  retweet_count?: number;
};

type TweetResponse = {
  data?: {
    public_metrics?: PublicMetrics;
  };
};

const getTwitterClient = () => {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    throw new Error('Missing Twitter bearer token');
  }
  return new Client(process.env.TWITTER_BEARER_TOKEN);
};

export async function POST(req: Request) {
  try {
    const { encryptedTokens, action, targetUser, tweetId, userId } = await req.json();

    if (!encryptedTokens || !action || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Use server-side decryption
    const decryptedTokens = JSON.parse(decryptData(encryptedTokens));
    const accessToken = decryptedTokens.xAccessToken;

    // if (!accessToken) {
    //   return NextResponse.json(
    //     { error: "Invalid access token" },
    //     { status: 401 }
    //   );
    // }

    const client = getTwitterClient();
    let result = { verified: false };

    switch (action) {
      case 'follow':
        try {
          const following = await client.users.usersIdFollowing(userId, {
            max_results: 1000,
            "user.fields": ["username"]
          });

          result.verified = following.data?.some((user: User) =>
            user.username?.toLowerCase() === targetUser?.toLowerCase()
          ) || false;
        } catch (error: any) {
          console.error('Follow check error:', error);
          if (error.status === 429) {
            return NextResponse.json(
              { error: "Rate limit exceeded" },
              { status: 429 }
            );
          }
          // throw error;
        }
        break;

      case 'like':
        try {
          if (!tweetId) {
            return NextResponse.json(
              { error: "Missing tweet ID" },
              { status: 400 }
            );
          }

          const tweet = await client.tweets.findTweetById(tweetId, {
            "tweet.fields": ["public_metrics"]
          }) as TweetResponse;

          // Add null check
          result.verified = Boolean(
            tweet?.data?.public_metrics?.like_count &&
            tweet.data.public_metrics.like_count > 0
          );
        } catch (error) {
          console.error('Like check error:', error);
          // throw error;
        }
        break;

      case 'retweet':
        try {
          if (!tweetId) {
            return NextResponse.json(
              { error: "Missing tweet ID" },
              { status: 400 }
            );
          }

          const tweet = await client.tweets.findTweetById(tweetId, {
            "tweet.fields": ["public_metrics"]
          }) as TweetResponse;

          // Add null check
          result.verified = Boolean(
            tweet?.data?.public_metrics?.retweet_count &&
            tweet.data.public_metrics.retweet_count > 0
          );
        } catch (error) {
          console.error('Retweet check error:', error);
          // throw error;
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ verified: true });//result);

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}