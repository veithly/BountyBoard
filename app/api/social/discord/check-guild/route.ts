import { NextResponse } from "next/server";
import { decryptData } from '@/utils/encryption-server';

export async function POST(req: Request) {
  try {
    const { encryptedTokens, guildId, userId } = await req.json();

    if (!encryptedTokens || !userId || !guildId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 401 }
      );
    }

    // Use server-side decryption
    const decryptedTokens = JSON.parse(decryptData(encryptedTokens));
    const accessToken = decryptedTokens.discordAccessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401 }
      );
    }

    // Get the user's guild list
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
    const isInGuild = guilds.some((guild: any) => guild.id === guildId);

    return NextResponse.json({
      inGuild: isInGuild,
    });

  } catch (error) {
    console.error("Discord guild check error:", error);
    return NextResponse.json(
      { error: "Failed to verify Discord guild membership" },
      { status: 500 }
    );
  }
}