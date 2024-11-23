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

export interface socialAccount {
  xAccessToken: string;
  xUserName: string;
  xName: string;
  discordAccessToken: string;
  discordUserName: string;
  discordName: string;
  githubAccessToken: string;
  githubUserName: string;
  githubName: string;
}
