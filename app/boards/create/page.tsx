"use client";

import { useCreateBoard } from "@/hooks/useContract";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BoardForm from "@/components/BoardForm";

export default function CreateBoardPage() {
  const createBoard = useCreateBoard();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/boards" className="text-purple-400 hover:text-purple-300">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
            Create New Bounty Board
          </h1>
        </div>

        <BoardForm
          onSubmit={createBoard}
          mode="create"
        />
      </div>
    </div>
  );
}