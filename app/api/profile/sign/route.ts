import { NextResponse } from 'next/server';
import { createWalletClient, http, defineChain, encodeAbiParameters, parseAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { lineaSepolia } from 'viem/chains';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_ADDRESS_PRIVATE_KEY as `0x${string}`;
const DOMAIN = {
  name: 'UserProfile',
  version: '1',
  chainId: lineaSepolia.id,
  verifyingContract: process.env.PORTAL_ADDRESS as `0x${string}`
};

const TYPES = {
  UserProfile: [
    { name: 'nickname', type: 'string' },
    { name: 'avatar', type: 'string' },
    { name: 'socialAccount', type: 'string' },
    { name: 'subject', type: 'address' }
  ]
};

export async function POST(request: Request) {
  try {
    const { nickname, avatar, socialAccount, subject } = await request.json();

    if (!nickname || !avatar || !socialAccount || !subject) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: lineaSepolia,
      transport: http()
    });

    const signature = await client.signTypedData({
      domain: DOMAIN,
      types: TYPES,
      primaryType: 'UserProfile',
      message: {
        nickname,
        avatar,
        socialAccount,
        subject
      }
    });

    return NextResponse.json({
      signature,
      nickname,
      avatar,
      socialAccount
    });
  } catch (error) {
    console.error("Signing error:", error);
    return NextResponse.json(
      { error: 'Failed to sign message' },
      { status: 500 }
    );
  }
}