export interface Submission {
  id: string;
  submitter: `0x${string}`;
  proof: string;
  reviewed: boolean;
  approved: boolean;
  submittedAt: string;
}

export interface Member {
  member: `0x${string}`;
}

// Board related interfaces
export interface BoardView {
  id: bigint;
  creator: `0x${string}`;
  name: string;
  description: string;
  img: string;
  totalPledged: bigint;
  createdAt: bigint;
  closed: boolean;
  rewardToken: `0x${string}`;
  config: string;
}

export interface BoardConfig {
  channelId?: string;
}

// Task related interfaces
export interface TaskView {
  id: bigint;
  name: string;
  creator: `0x${string}`;
  description: string;
  deadline: bigint;
  maxCompletions: bigint;
  numCompletions: bigint;
  completed: boolean;
  rewardAmount: bigint;
  createdAt: bigint;
  cancelled: boolean;
  config: string;
  allowSelfCheck: boolean;
  reviewers: `0x${string}`[];
}

// Submission related interfaces
export interface SubmissionView {
  submitter: `0x${string}`;
  proof: string;
  status: number;
  submittedAt: bigint;
  reviewComment: string;
}

// Board Detail View Interface
export interface BoardDetailView {
  id: bigint;
  creator: `0x${string}`;
  name: string;
  description: string;
  img: string;
  totalPledged: bigint;
  createdAt: bigint;
  closed: boolean;
  rewardToken: `0x${string}`;
  tasks: TaskView[];
  submissions: SubmissionView[][];
  members: `0x${string}`[];
  userTaskStatuses: UserTaskStatus[];
  config: string;
}

// Create parameter interface for Board
export interface CreateBoardParams {
  name: string;
  description: string;
  img: string;
  rewardToken: string;
  config?: string;
}

export interface TaskConfig {
  taskType: ['Plain Text' | 'Image' | 'Github Pull Request' | 'Contract Verification' | 'X Post' | 'X Follow' | 'X Retweet' | 'X Like' | 'Join Discord'];
  aiReview?: boolean;
  aiReviewPrompt?: string;
  contractNetwork?: 'Mantle' | 'Mantle Sepolia' | 'Linea' | 'Linea Sepolia' | 'Ethereum' | 'Sepolia' | 'Flow EVM' | 'Flow EVM Testnet' | 'BSC' | 'BSC Testnet' | 'opBNB' | 'opBNB Testnet' | 'Monad Devnet';
  XPostContent?: string;
  XFollowUsername?: string;
  XLikeId?: string;
  XRetweetId?: string;
  DiscordChannelId?: string;
  DiscordInviteLink?: string;
}

// Interface for creating Task parameters
export interface CreateTaskParams {
  boardId: bigint;
  name: string;
  description: string;
  deadline: number;
  maxCompletions: number;
  rewardAmount: number;
  config: TaskConfig | string;
  allowSelfCheck: boolean;
}

// Update the parameter interface of Task
export interface UpdateTaskParams extends CreateTaskParams {
  taskId: bigint;
}

export interface SubmissionProof {
  text?: string;
  image?: string;
  github?: string;
  contract?: string;
  xId?: string;
  xUserName?: string;
  xName?: string;
  xPost?: string;
  xFollow?: boolean;
  xRetweet?: boolean;
  xLike?: boolean;
  discordId?: string;
  discordUserName?: string;
  discordName?: string;
  discordJoined?: boolean;
  discordJoinedAt?: string;
}

export interface SelfCheckParams {
  boardId: bigint;
  taskId: bigint;
  signature: `0x${string}`;
  checkData: string;
}

// Interface for submitting Proof parameters
export interface SubmitProofParams {
  boardId: bigint;
  taskId: bigint;
  proof: string;
}

// Interface for auditing submitted parameters
export interface ReviewSubmissionParams {
  boardId: bigint;
  taskId: bigint;
  submissionAddress: `0x${string}`;
  approved: number;
  reviewComment: string;
}

// Add the parameter interface for the auditor
export interface AddReviewerParams {
  boardId: bigint;
  taskId: bigint;
  reviewer: string;
}

// Parameters interface for staking tokens
export interface PledgeTokensParams {
  boardId: bigint;
  amount: number;
}

// Update the parameter interface of Board
export interface UpdateBoardParams {
  boardId: bigint;
  name: string;
  description: string;
  rewardToken: string;
}

// TaskDetailView
export interface TaskDetailView {
  id: bigint;
  name: string;
  creator: `0x${string}`;
  description: string;
  deadline: bigint;
  maxCompletions: bigint;
  numCompletions: bigint;
  completed: boolean;
  rewardAmount: bigint;
  createdAt: bigint;
  cancelled: boolean;
  config: string;
  allowSelfCheck: boolean;
}

// User task status interface
export interface UserTaskStatus {
  taskId: bigint;
  submitted: boolean;
  status: number;
  submittedAt: bigint;
  submitProof: string;
  reviewComment: string;
}
