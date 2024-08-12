"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { erc20Abi, parseUnits } from "viem";
import { toast } from "@/components/ui/use-toast";
import { useWriteContract } from "wagmi";

interface BoardActionsDropdownProps {
  isCreator: boolean;
  isMember: boolean;
  rewardTokenAddress: `0x${string}`;
  onOpenUpdateBoardModal: () => void;
  onCloseBoard: () => void;
  onWithdrawPledgedTokens: () => void;
  onOpenPledgeTokensModal: () => void;
}

const contractAddress = process.env.NEXT_PUBLIC_BOUNTY_BOARD_CONTRACT_ADDRESS as `0x${string}`;

export default function BoardActionsDropdown({
  isCreator,
  isMember,
  rewardTokenAddress,
  onOpenUpdateBoardModal,
  onCloseBoard,
  onWithdrawPledgedTokens,
  onOpenPledgeTokensModal,
}: BoardActionsDropdownProps) {
  const { writeContractAsync } = useWriteContract();

  const handleApproveTokens = async () => {
    try {
      const amount = parseUnits('1000000000', 18); // 设置一个较大的授权额度
      await writeContractAsync({
        address: rewardTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress, amount],
      });
    } catch (error: Error | any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Board Actions</DropdownMenuLabel>
        {isMember && (
          <>
            <DropdownMenuItem onClick={handleApproveTokens}>
              Approve Tokens
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPledgeTokensModal}>
              Pledge Tokens
            </DropdownMenuItem>
          </>
        )}
        {isCreator && (
          <>
            <DropdownMenuItem onClick={onOpenUpdateBoardModal}>
              Update Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCloseBoard}>
              Close Board
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onWithdrawPledgedTokens}>
              Withdraw Pledged Tokens
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
