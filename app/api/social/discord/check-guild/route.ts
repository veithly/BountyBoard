import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const accessToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    const userId = req.headers.get('X-User-Id');
    const guildId = req.headers.get('X-Guild-Id'); // Discord 服务器 ID

    if (!accessToken || !userId || !guildId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 401 }
      );
    }

    // 1. 先获取用户的公会列表
    const guildsResponse = await fetch(
      'https://discord.com/api/users/@me/guilds',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        next: { revalidate: 0 }
      }
    );

    if (!guildsResponse.ok) {
      throw new Error('Failed to fetch user guilds');
    }

    const guilds = await guildsResponse.json();

    // 2. 检查用户是否在指定的公会中
    const isInGuild = guilds.some((guild: any) => guild.id === guildId);

    if (!isInGuild) {
      throw new Error('Failed to fetch member data');
    }

    return NextResponse.json({
      inGuild: true,
    });

  } catch (error) {
    console.error("Discord guild check error:", error);
    return NextResponse.json(
      { error: "Failed to verify Discord guild membership" },
      { status: 500 }
    );
  }
}