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

// Board 相关接口
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
}

// Task 相关接口
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

// Submission 相关接口
export interface SubmissionView {
  taskId: bigint;
  submitter: `0x${string}`;
  proof: string;
  status: number;
  submittedAt: bigint;
  reviewComment: string;
}

// Board 详情视图接口
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
  submissions: SubmissionView[];
  members: `0x${string}`[];
  userTaskStatuses: UserTaskStatus[];
}

// 创建 Board 的参数接口
export interface CreateBoardParams {
  name: string;
  description: string;
  img: string;
  rewardToken: string;
}

export interface TaskConfig {
  taskType: ['Plain Text' | 'Image' | 'Github Pull Request' | 'Contract Verification' | 'X Post' | 'X Follow' | 'X Retweet' | 'X Like' | 'Join Discord'];
  aiReview?: boolean;
  aiReviewPrompt?: string;
  contractNetwork?: 'Linea' | 'Linea Sepolia' | 'Ethereum' | 'Sepolia';
  XPostContent?: string;
  XFollowUsername?: string;
  XLikeId?: string;
  XRetweetId?: string;
  DiscordChannelId?: string;
  DiscordInviteLink?: string;
}

// 创建 Task 的参数接口
export interface CreateTaskParams {
  boardId: bigint;
  name: string;
  description: string;
  deadline: number;
  maxCompletions: number;
  rewardAmount: number;
  config: TaskConfig;
  allowSelfCheck: boolean;
}

// 更新 Task 的参数接口
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

// 提交 Proof 的参数接口
export interface SubmitProofParams {
  boardId: bigint;
  taskId: bigint;
  proof: string;
}

// 审核提交的参数接口
export interface ReviewSubmissionParams {
  boardId: bigint;
  taskId: bigint;
  submissionAddress: `0x${string}`;
  approved: number;
  reviewComment: string;
}

// 添加审核员的参数接口
export interface AddReviewerParams {
  boardId: bigint;
  taskId: bigint;
  reviewer: string;
}

// 质押代币的参数接口
export interface PledgeTokensParams {
  boardId: bigint;
  amount: number;
}

// 更新 Board 的参数接口
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

// 用户任务状态接口
export interface UserTaskStatus {
  taskId: bigint;
  submitted: boolean;
  status: number;
  submittedAt: bigint;
  submitProof: string;
  reviewComment: string;
}
