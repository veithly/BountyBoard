import {
  useAccount,
  useReadContract,
  useWriteContract,
  type BaseError,
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import abi from "@/constants/BountyBoard.json";
import { erc20Abi, parseUnits, zeroAddress } from "viem";
import type {
  BoardView,
  TaskView,
  BoardDetailView,
  CreateBoardParams,
  CreateTaskParams,
  UpdateTaskParams,
  SubmitProofParams,
  ReviewSubmissionParams,
  AddReviewerParams,
  PledgeTokensParams,
  SelfCheckParams,
} from "@/types/types";
import contractAddress from "@/constants/contract-address";

// 通用合约函数调用 hook
export function useContractFunction(functionName: string) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { chain } = useAccount();
  return async (args: any[], value?: bigint) => {
    console.log("Contract Function:", functionName, args);
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });

      const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;
      console.log("chain?.name", chain?.name);
      console.log("bountyBoardAddress", bountyBoardAddress);

      const hash = await writeContractAsync({
        functionName,
        abi,
        address: bountyBoardAddress,
        args,
        value,
      });
      return { hash };
    } catch (err: BaseError | any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      console.error("Write Error:", err);
      return { error: err.message };
    }
  };
}

// 创建板块
export function useCreateBoard() {
  const contractFunction = useContractFunction("createBountyBoard");

  return ({ name, description, img, rewardToken }: CreateBoardParams) => {
    if (!rewardToken) {
      rewardToken = zeroAddress;
    }
    return contractFunction([name, description, img, rewardToken]);
  };
}

// 创建任务
export function useCreateTask() {
  const contractFunction = useContractFunction("createTask");

  return ({
    boardId,
    name,
    description,
    deadline,
    maxCompletions,
    rewardAmount,
    config,
    allowSelfCheck,
  }: CreateTaskParams) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([
      boardId,
      name,
      description,
      deadline,
      maxCompletions,
      formatAmount,
      config,
      allowSelfCheck,
    ]);
  };
}

// 更新任务
export function useUpdateTask() {
  const contractFunction = useContractFunction("updateTask");

  return ({
    boardId,
    taskId,
    name,
    description,
    deadline,
    maxCompletions,
    rewardAmount,
    config,
    allowSelfCheck,
  }: UpdateTaskParams) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([
      boardId,
      taskId,
      name,
      description,
      deadline,
      maxCompletions,
      formatAmount,
      config,
      allowSelfCheck,
    ]);
  };
}

// 提交证明
export function useSubmitProof() {
  const contractFunction = useContractFunction("submitProof");

  return ({ boardId, taskId, proof }: SubmitProofParams) => {
    return contractFunction([boardId, taskId, proof]);
  };
}

// 审核提交
export function useReviewSubmission() {
  const contractFunction = useContractFunction("reviewSubmission");

  return ({
    boardId,
    taskId,
    submissionAddress,
    approved,
    reviewComment
  }: ReviewSubmissionParams) => {
    if (approved === undefined) {
      approved = 0;
    }
    return contractFunction([boardId, taskId, submissionAddress, approved, reviewComment || '']);
  };
}

// 自检提交
export function useSelfCheckSubmission() {
  const contractFunction = useContractFunction('selfCheckSubmission');

  return async ({
    boardId,
    taskId,
    signature,
    checkData
  }: {
    boardId: bigint;
    taskId: bigint;
    signature: `0x${string}`;
    checkData: string;
  }) => {
    return contractFunction([boardId, taskId, signature, checkData]);
  };
}


// 添加审核员
export function useAddReviewerToTask() {
  const contractFunction = useContractFunction("addReviewerToTask");

  return ({ boardId, taskId, reviewer }: AddReviewerParams) => {
    return contractFunction([boardId, taskId, reviewer]);
  };
}

// 自行检查
export function useSelfCheck() {
  const contractFunction = useContractFunction("selfCheck");

  return ({ boardId, taskId, checkData, signature }: SelfCheckParams) => {
    return contractFunction([boardId, taskId, checkData, signature]);
  };
}

// 取消任务
export function useCancelTask() {
  const contractFunction = useContractFunction("cancelTask");

  return ({ boardId, taskId }: { boardId: bigint; taskId: bigint }) => {
    return contractFunction([boardId, taskId]);
  };
}

// 授权代币
export function useApproveTokens(tokenAddress: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { chain } = useAccount();
  const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;

  return async (amount: bigint) => {
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [bountyBoardAddress, amount],
      });
      return { hash };
    } catch (error: Error | any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return { error: error.message };
    }
  };
}

// 质押代币
export function usePledgeTokens(tokenAddress: `0x${string}`) {
  const { address, chain } = useAccount();
  const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, bountyBoardAddress],
  });
  const { toast } = useToast();
  const contractFunction = useContractFunction("pledgeTokens");

  return async ({ boardId, amount }: PledgeTokensParams) => {
    await refetch();
    const formatAmount = parseUnits(amount.toString(), 18);
    const allowanceNumber = allowance ? Number(allowance) : 0;

    if (allowanceNumber < formatAmount && tokenAddress !== zeroAddress) {
      toast({
        title: "Need Approval",
        description: "Please approve the contract to spend your tokens.",
      });
      throw new Error("Need Approval");
    } else if (tokenAddress === zeroAddress) {
      toast({
        title: "Warning",
        description:
          "You are pledging ETH, please confirm the transaction in your wallet.",
      });
      return await contractFunction([boardId, formatAmount], formatAmount);
    }
    return await contractFunction([boardId, formatAmount]);
  };
}

// 加入赏金板
export function useJoinBoard() {
  const contractFunction = useContractFunction("joinBoard");

  return ({ boardId }: { boardId: bigint }) => {
    return contractFunction([boardId]);
  };
}

// 添加审核员
export function useAddReviewerToBounty() {
  const contractFunction = useContractFunction("addReviewerToBounty");

  return ({
    boardId,
    bountyId,
    reviewer,
  }: {
    boardId: number;
    bountyId: number;
    reviewer: string;
  }) => {
    return contractFunction([boardId, bountyId, reviewer]);
  };
}

// 取消赏金任务
export function useCancelBounty() {
  const contractFunction = useContractFunction("cancelBounty");

  return ({ boardId, bountyId }: { boardId: bigint; bountyId: bigint }) => {
    return contractFunction([boardId, bountyId]);
  };
}

// 关闭赏金板
export function useCloseBoard() {
  const contractFunction = useContractFunction("closeBoard");

  return ({ boardId }: { boardId: bigint }) => {
    return contractFunction([boardId]);
  };
}

// 提取质押代币
export function useWithdrawPledgedTokens() {
  const contractFunction = useContractFunction("withdrawPledgedTokens");

  return ({ boardId }: { boardId: bigint }) => {
    return contractFunction([boardId]);
  };
}

// 更新赏金板
export function useUpdateBountyBoard() {
  const contractFunction = useContractFunction("updateBountyBoard");

  return ({
    boardId,
    name,
    description,
    rewardToken,
  }: {
    boardId: bigint;
    name: string;
    description: string;
    rewardToken: string;
  }) => {
    if (!rewardToken) {
      rewardToken = zeroAddress;
    }
    return contractFunction([boardId, name, description, rewardToken]);
  };
}

export function useTokenSymbol(rewardTokenAddress: `0x${string}`) {
  return useReadContract({
    address: rewardTokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
  });
}


// 读取函数
export function useGetAllBoards() {
  const { chain } = useAccount();

  const bountyBoardAddress = contractAddress.BountyBoard[
    (chain?.name || 'Linea Sepolia Testnet') as keyof typeof contractAddress.BountyBoard
  ] as `0x${string}`;

  return useReadContract<typeof abi, "getAllBoards", BoardView[]>({
    address: bountyBoardAddress,
    abi,
    functionName: "getAllBoards",
    query: {
      enabled: true,
      gcTime: 0,
    }
  });
}
export function useGetBoardDetail(boardId: bigint) {
  const { chain, address } = useAccount();

  const bountyBoardAddress = contractAddress.BountyBoard[
    (chain?.name || 'Linea Sepolia Testnet') as keyof typeof contractAddress.BountyBoard
  ] as `0x${string}`;

  return useReadContract<typeof abi, "getBoardDetail", [BoardDetailView]>({
    address: bountyBoardAddress,
    abi,
    functionName: "getBoardDetail",
    args: [boardId],
    account: address || zeroAddress,
    query: {
      enabled: true,
      gcTime: 0,
    }
  });
}

export function useGetTasksForBoard(boardId: bigint) {
  const { chain } = useAccount();
  const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;
  return useReadContract<typeof abi, "getTasksForBoard", TaskView[]>({
    address: bountyBoardAddress,
    abi,
    functionName: "getTasksForBoard",
    args: [boardId],
  });
}
export function useIsBoardMember(boardId: string, address?: `0x${string}`) {
  const { chain } = useAccount();
  const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;
  return useReadContract<typeof abi, "isBoardMember", [boolean]>({
    address: bountyBoardAddress,
    abi,
    functionName: "isBoardMember",
    args: [boardId, address],
  });
}

// 获取用户加入的所有板块
export function useGetBoardsByMember(address?: `0x${string}`) {
  const { chain } = useAccount();
  const bountyBoardAddress = contractAddress.BountyBoard[chain?.name as keyof typeof contractAddress.BountyBoard] as `0x${string}`;

  return useReadContract<typeof abi, "getBoardsByMember", BoardView[]>({
    address: bountyBoardAddress,
    abi,
    functionName: "getBoardsByMember",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });
}
