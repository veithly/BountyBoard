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
  twitter?: string;
  discord?: string;
  github?: string;
  telegram?: string;
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
  encryptedTokens?: string;
  telegramUsername?: string;
  telegramUserId?: string;
}
