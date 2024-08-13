import { useAccount, useReadContract, useWriteContract, type BaseError } from 'wagmi';
import { useToast } from "@/components/ui/use-toast"
import abi from '@/abis/BountyBoard.json';
import { erc20Abi, parseUnits } from 'viem';

const contractAddress = process.env.NEXT_PUBLIC_BOUNTY_BOARD_CONTRACT_ADDRESS as `0x${string}`;

// 通用合约函数调用 hook
export function useContractFunction(functionName: string) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  return async (args: any[]) => {
    console.log('Contract Function:', functionName, args);
    try {
      toast({ title: 'Nofitication', description: 'Please confirm the transaction in your wallet.' });
      const hash = await writeContractAsync({
        functionName,
        abi,
        address: contractAddress,
        args,
      });
      return { hash };
    } catch (err: BaseError | any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      console.error('Write Error:', err);
      return { error: err.message };
    }
  };
};

// 创建赏金板
export function useCreateBountyBoard() {
  const contractFunction = useContractFunction('createBountyBoard');

  return ({ name, description, rewardToken }: { name: string; description: string; rewardToken: string }) => {
    return contractFunction([name, description, rewardToken]);
  };
}

// 创建赏金任务
export function useCreateBounty() {
  const contractFunction = useContractFunction('createBounty');

  return ({ boardId, description, deadline, maxCompletions, rewardAmount }:
    { boardId: number; description: string; deadline: number; maxCompletions: number; rewardAmount: number }) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([boardId, description, deadline, maxCompletions, formatAmount]);
  };
}

// 授权代币
export function useApproveTokens(tokenAddress: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  return async (amount: bigint) => {
    try {
      toast({
        title: 'Notification',
        description: 'Please confirm the transaction in your wallet.',
      });
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress, amount],
      });
      return { hash };
    } catch (error: Error | any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      return { error: error.message };
    }
  };
}

// 质押代币
export function usePledgeTokens(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, contractAddress],
  });
  const { toast } = useToast();
  const contractFunction = useContractFunction('pledgeTokens');
  return async ({ boardId, amount }: { boardId: number; amount: number }) => {
    const formatAmount = parseUnits(amount.toString(), 18);
    const allowanceNumber = allowance ? Number(allowance) : 0;

    // 检查授权额度是否足够
    if (allowanceNumber < formatAmount) {
      toast({ title: "Need Approval", description: "Please approve the contract to spend your tokens." });
      throw new Error('Need Approval');
    }
    // 质押代币
    return await contractFunction([boardId, formatAmount]);
  };
}

// 加入赏金板
export function useJoinBoard() {
  const contractFunction = useContractFunction('joinBoard');

  return ({ boardId }: { boardId: number }) => {
    return contractFunction([boardId]);
  };
}

// 更新赏金任务
export function useUpdateBounty() {
  const contractFunction = useContractFunction('updateBounty');

  return ({ boardId, bountyId, description, deadline, maxCompletions, rewardAmount }:
    { boardId: number; bountyId: number; description: string; deadline: number; maxCompletions: number; rewardAmount: number }) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([boardId, bountyId, description, deadline, maxCompletions, formatAmount]);
  };
}

// 提交证明
export function useSubmitProof() {
  const contractFunction = useContractFunction('submitProof');

  return ({ boardId, bountyId, proof }: { boardId: number; bountyId: number; proof: string }) => {
    return contractFunction([boardId, bountyId, proof]);
  };
}

// 审核提交
export function useReviewSubmission() {
  const contractFunction = useContractFunction('reviewSubmission');

  return ({ boardId, bountyId, submissionIndex, approved }:
    { boardId: number; bountyId: number; submissionIndex: number; approved: boolean }) => {
    return contractFunction([boardId, bountyId, submissionIndex, approved || false]);
  };
}

// 添加审核员
export function useAddReviewerToBounty() {
  const contractFunction = useContractFunction('addReviewerToBounty');

  return ({ boardId, bountyId, reviewer }: { boardId: number; bountyId: number; reviewer: string }) => {
    return contractFunction([boardId, bountyId, reviewer]);
  };
}

// 取消赏金任务
export function useCancelBounty() {
  const contractFunction = useContractFunction('cancelBounty');

  return ({ boardId, bountyId }: { boardId: number; bountyId: number }) => {
    return contractFunction([boardId, bountyId]);
  };
}

// 关闭赏金板
export function useCloseBoard() {
  const contractFunction = useContractFunction('closeBoard');

  return ({ boardId }: { boardId: number }) => {
    return contractFunction([boardId]);
  };
}

// 提取质押代币
export function useWithdrawPledgedTokens() {
  const contractFunction = useContractFunction('withdrawPledgedTokens');

  return ({ boardId }: { boardId: number }) => {
    return contractFunction([boardId]);
  };
}

// 更新赏金板
export function useUpdateBountyBoard() {
  const contractFunction = useContractFunction('updateBountyBoard');

  return ({ boardId, name, description, rewardToken }:
    { boardId: number; name: string; description: string; rewardToken: string }) => {
    return contractFunction([boardId, name, description, rewardToken]);
  };
}

export function useTokenSymbol(rewardTokenAddress: `0x${string}`) {
  return useReadContract({
    address: rewardTokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });
}
