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


export default function BoardActionsDropdown({
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
