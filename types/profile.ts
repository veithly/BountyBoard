export interface UserProfile {
  nickname: string;
  avatar: string;
  socialAccount: string;
}

export interface AttestationData {
  nickname: string;
  avatar: string;
  socialAccount: string;
  signature: Uint8Array;
}

export interface SocialAccount {
  xUserName?: string;
  xName?: string;
  xId?: string;
  discordUserName?: string;
  discordName?: string;
  discordId?: string;
  githubUserName?: string;
  githubName?: string;
  githubId?: string;
  xAccessToken?: string;
  discordAccessToken?: string;
  githubAccessToken?: string;
  telegramUsername?: string;
  telegramUserId?: number | null;
  encryptedTokens?: string;
}