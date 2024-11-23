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
  xId: string;
  discordId: string;
  githubId: string;
}
