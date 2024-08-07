import { useWriteContract } from 'wagmi';
import abi from '@/abis/BountyBoard.json'; // 导入 ABI

const contractAddress = process.env.NEXT_PUBLIC_BOUNTY_BOARD_CONTRACT_ADDRESS as `0x${string}`;

// 创建赏金板
export function useCreateBountyBoard() {
  const { writeContract } = useWriteContract();

  return ({ name, description, rewardToken }: { name: string; description: string; rewardToken: string }) => {
    return writeContract({
      functionName: 'createBountyBoard',
      abi,
      address: contractAddress,
      args: [name, description, rewardToken],
    });
  };
}

// 创建赏金任务
export function useCreateBounty() {
  const { writeContract } = useWriteContract();

  return ({
    boardId,
    description,
    deadline,
    maxCompletions,
    rewardAmount,
  }: {
    boardId: number;
    description: string;
    deadline: number;
    maxCompletions: number;
    rewardAmount: bigint;
  }) => {
    return writeContract({
        functionName: 'createBounty',
        abi,
        address: contractAddress,
        args: [boardId, description, deadline, maxCompletions, rewardAmount],
    });
  };
}

// 加入赏金板
export function useJoinBoard() {
  const { writeContract } = useWriteContract();

  return ({ boardId }: { boardId: number }) => {
    return writeContract({
        functionName: 'joinBoard',
        abi,
        address: contractAddress,
        args: [boardId],
    });
  };
}

// 提交任务完成证明
export function useSubmitProof() {
  const { writeContract } = useWriteContract();

  return ({ boardId, bountyId, proof }: { boardId: number; bountyId: number; proof: string }) => {
    return writeContract({
        functionName: 'submitProof',
        abi,
        address: contractAddress,
        args: [boardId, bountyId, proof],
    });
  };
}

// 质押代币
export function usePledgeTokens() {
  const { writeContract } = useWriteContract();

  return ({ boardId, amount }: { boardId: number; amount: bigint }) => {
    return writeContract({
        functionName: 'pledgeTokens',
        abi,
        address: contractAddress,
        args: [boardId, amount],
        // 如果使用 ETH 作为奖励，需要在这里添加 value 参数
        // value: amount,
    });
  };
}