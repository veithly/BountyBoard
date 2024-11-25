import { NextResponse } from "next/server";
import { Client } from "twitter-api-sdk";

// Define simplified types instead of using Components
type User = {
  id?: string;
  username?: string;
};

type Tweet = {
  id?: string;
};

// 扩展类型定义
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

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('X-User-Id');
    const targetUserId = req.headers.get('X-Target-User');
    const tweetId = req.headers.get('X-Tweet-Id');
    const action = req.headers.get('X-Action-Type');

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

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
            user.username?.toLowerCase() === targetUserId?.toLowerCase()
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

          // 添加空值检查
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

          // 添加空值检查
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

  } catch (error) {
    console.error("Twitter action verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify Twitter action" },
      { status: 500 }
    );
  }
}