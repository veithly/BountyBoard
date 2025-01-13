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

    // Use Discord API to get user information
    const response = await fetch(
      `https://discord.com/api/users/@me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Discord user data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Discord verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify Discord account" },
      { status: 500 }
    );
  }
}