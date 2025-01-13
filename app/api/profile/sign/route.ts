import { keccak256, encodeAbiParameters, parseAbiParameters, SignableMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NextRequest, NextResponse } from 'next/server';

const SIGNER_PRIVATE_KEY = process.env.SIGNER_ADDRESS_PRIVATE_KEY as `0x${string}`;

export async function POST(req: NextRequest) {
  try {
    const { nickname, avatar, socialAccount, subject } = await req.json();

    // 验证参数
    if (!nickname || !avatar || !socialAccount || !subject) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 验证私钥格式
    if (!SIGNER_PRIVATE_KEY || !SIGNER_PRIVATE_KEY.startsWith('0x') || SIGNER_PRIVATE_KEY.length !== 66) {
      throw new Error('Invalid SIGNER_PRIVATE_KEY format');
    }

    // 构造消息
    const message = encodeAbiParameters(
      parseAbiParameters('string, string, string, address'),
      [nickname, avatar, socialAccount, subject as `0x${string}`]
    );

    // 计算消息哈希
    const messageHash = keccak256(message);

    // 创建账户
    const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

    // 签名消息
    const signature = await account.signMessage({
      message: { raw: messageHash } as SignableMessage
    });

    return NextResponse.json({
      signature,
      nickname,
      avatar,
      socialAccount
    });
  } catch (error) {
    console.error('Error in profile signing:', error);
    return NextResponse.json(
      { error: 'Failed to sign message' },
      { status: 500 }
    );
  }
}