'use client';

import { useAccount } from 'wagmi';
import { useGetBoardsByMember } from '@/hooks/useContract';
import BoardCard from '@/components/BoardCard';
import BoardsPageSkeleton from "@/components/BoardsPageSkeleton";
import { BoardView } from '@/types/types';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JoinedBoardsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: boardsData, isLoading } = useGetBoardsByMember(address);

  if (isLoading) {
    return <BoardsPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-purple-400 bg-clip-text text-transparent">
          Your Joined Boards
        </h1>
        <Button
          onClick={() => router.push('/boards/create')}
          className="bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 backdrop-blur-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boardsData?.map((board: BoardView) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </div>
    </div>
  );
}