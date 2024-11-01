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
  cancelled: boolean;
  completed: boolean;
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
  reviewers: `0x${string}`[];
  createdAt: bigint;
  cancelled: boolean;
}

// Submission 相关接口
export interface SubmissionView {
  taskId: bigint;
  submitter: `0x${string}`;
  proof: string;
  reviewed: boolean;
  approved: boolean;
  submittedAt: bigint;
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
}

// 创建 Board 的参数接口
export interface CreateBoardParams {
  name: string;
  description: string;
  img: string;
  rewardToken: string;
}

// 创建 Task 的参数接口
export interface CreateTaskParams {
  boardId: bigint;
  name: string;
  description: string;
  deadline: number;
  maxCompletions: number;
  rewardAmount: number;
}

// 更新 Task 的参数接口
export interface UpdateTaskParams extends CreateTaskParams {
  taskId: number;
}

// 提交 Proof 的参数接口
export interface SubmitProofParams {
  boardId: bigint;
  taskId: number;
  proof: string;
}

// 审核提交的参数接口
export interface ReviewSubmissionParams {
  boardId: bigint;
  taskId: number;
  submissionAddress: `0x${string}`;
  approved: boolean;
}

// 添加审核员的参数接口
export interface AddReviewerParams {
  boardId: bigint;
  taskId: number;
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
