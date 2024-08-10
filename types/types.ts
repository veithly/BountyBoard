export interface Reviewer {
  id: string;
  reviewerAddress: `0x${string}`;
}

export interface Submission {
  id: string;
  submitter: `0x${string}`;
  proof: string;
  reviewed: boolean;
  approved: boolean;
  submittedAt: string;
}

export interface Bounty {
  id: string;
  description: string;
  creator: `0x${string}`;
  deadline: string;
  maxCompletions: string;
  numCompletions: string;
  rewardAmount: string;
  reviewers: Reviewer[];
  submissions: Submission[];
  createdAt: string;
}

export interface Member {
  member: `0x${string}`;
}

export interface Board {
  id: string;
  creator: `0x${string}`;
  name: string;
  description: string;
  rewardToken: `0x${string}`;
  totalPledged: string;
  createdAt: string;
  bounties: Bounty[];
  members: Member[];
}
