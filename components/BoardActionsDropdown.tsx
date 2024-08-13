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
  onApproveTokens: () => void;
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
  onApproveTokens,
  onOpenPledgeTokensModal,
}: BoardActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Board Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onApproveTokens}>
            Approve Tokens
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenPledgeTokensModal}>
            Pledge Tokens
          </DropdownMenuItem>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
