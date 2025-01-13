import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const accessToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    const userId = req.headers.get('X-User-Id');

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: "Missing authentication data" },
        { status: 401 }
      );
    }

    // Use GitHub API to get user information
    const response = await fetch(
      `https://api.github.com/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify GitHub account" },
      { status: 500 }
    );
  }
}