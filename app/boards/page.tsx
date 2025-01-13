"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useGetAllBoards, useGetProfiles } from "@/hooks/useContract";
import { type BoardView } from "@/types/types";
import BoardCard from "@/components/BoardCard";
import BoardsPageSkeleton from "@/components/BoardsPageSkeleton";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Suspense } from "react";

function BoardsPageInner() {
  const router = useRouter();
  const { data: boardsData, isLoading } = useGetAllBoards();
  const { address } = useAccount();

  // Get all creator addresses
  const creatorAddresses = useMemo(() => {
    if (!boardsData || !Array.isArray(boardsData)) return [];
    return boardsData.map((board: BoardView) => board.creator as `0x${string}`);
  }, [boardsData]);

  // Batch retrieve creator profiles
  const { data: profilesData } = useGetProfiles(creatorAddresses);

  // Convert data information into a map format.
  const creatorProfiles = useMemo(() => {
    if (!profilesData || !Array.isArray(profilesData)) return {};

    const [nicknames, avatars, socialAccounts, _, __] = profilesData;
    return creatorAddresses.reduce((acc, address, index) => {
      acc[address.toLowerCase()] = {
        nickname: nicknames[index],
        avatar: avatars[index],
        socialAccount: socialAccounts[index]
      };
      return acc;
    }, {} as Record<string, { nickname: string; avatar: string; socialAccount: string }>);
  }, [profilesData, creatorAddresses]);

  if (isLoading) {
    return <BoardsPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-200 to-purple-400 bg-clip-text text-transparent">
          All Boards
        </h1>
        {address && (
          <Button
            onClick={() => router.push('/boards/create')}
            className="w-full sm:w-auto bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 backdrop-blur-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Board
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.isArray(boardsData) && boardsData.map((board: BoardView) => (
          <BoardCard
            key={board.id.toString()}
            board={board}
            creatorProfile={creatorProfiles[board.creator.toLowerCase()]}
          />
        ))}
      </div>
    </div>
  );
}

export default function BoardsPage() {
  return (
    <Suspense fallback={null}>
      <BoardsPageInner />
    </Suspense>
  );
}
