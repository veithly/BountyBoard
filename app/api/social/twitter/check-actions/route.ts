import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const accessToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    const userId = req.headers.get('X-User-Id');
    const targetUserId = req.headers.get('X-Target-User');
    const tweetId = req.headers.get('X-Tweet-Id');
    const action = req.headers.get('X-Action-Type'); // 'follow', 'like', 'retweet'

    if (!accessToken || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 401 }
      );
    }

    // Twitter API v2 endpoints
    const endpoints = {
      follow: `https://api.twitter.com/2/users/${userId}/following`,
      like: `https://api.twitter.com/2/users/${userId}/likes`,
      retweet: `https://api.twitter.com/2/users/${userId}/retweets`,
      tweet: `https://api.twitter.com/2/tweets/search/recent`
    };

    let response;
    let result = { verified: false };

    switch (action) {
      case 'follow':
        // 检查是否关注了目标用户
        response = await fetch(
          `https://api.twitter.com/2/users/${userId}/following/${targetUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            next: { revalidate: 0 }
          }
        );
        result.verified = response.status === 200;
        break;

      case 'like':
        // 检查是否点赞了特定推文
        response = await fetch(
          `https://api.twitter.com/2/users/${userId}/likes?tweet.fields=id&max_results=100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            next: { revalidate: 0 }
          }
        );
        if (response.ok) {
          const data = await response.json();
          result.verified = data.data?.some((tweet: any) => tweet.id === tweetId);
        }
        break;

      case 'retweet':
        // 检查是否转发了特定推文
        response = await fetch(
          `https://api.twitter.com/2/users/${userId}/retweets?tweet.fields=id&max_results=100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            next: { revalidate: 0 }
          }
        );
        if (response.ok) {
          const data = await response.json();
          result.verified = data.data?.some((tweet: any) => tweet.id === tweetId);
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Twitter action verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify Twitter action" },
      { status: 500 }
    );
  }
}