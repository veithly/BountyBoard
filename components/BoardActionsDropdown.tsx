'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface BoardActionsDropdownProps {
  onOpenUpdateBoardModal: () => void;
  onCloseBoard: () => void;
  onWithdrawPledgedTokens: () => void;
}

export default function BoardActionsDropdown({ onOpenUpdateBoardModal, onCloseBoard, onWithdrawPledgedTokens }: BoardActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Board Actions</DropdownMenuLabel>
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
