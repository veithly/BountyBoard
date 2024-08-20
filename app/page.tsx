"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/DynamicModal";
import { useCreateBountyBoard } from "@/hooks/contract";
import { BOARDS } from "@/graphql/queries";
import { Board } from "@/types/types";
import { request } from 'graphql-request';
import { useQuery } from "@tanstack/react-query";
import BoardCard from "@/components/BoardCard";

const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT as string;

const modalConfigs = {
  addBoard: {
    title: 'Add New Board',
    description: 'Create a new bounty board with a name, description, and reward token(blank for ETH).',
    fields: [
      { name: 'name', label: 'Board Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'rewardToken', label: 'Reward Token Address', type: 'text' },
    ],
  },
};

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const createBountyBoard = useCreateBountyBoard();

  const { data: boardsData, refetch } = useQuery({
    queryKey: ['boards'],
    async queryFn() {
      const result = await request(url, BOARDS) as { boards: Board[] };
      return result.boards as Board[];
    },
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: any) => {
    return await createBountyBoard(data);
  };

  return (
    <div className="container mx-auto p-4">
      <Button className="mb-4" onClick={handleOpenModal}>
        Add Board
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boardsData?.map((board: Board) => (
          !board.closed && <BoardCard key={board.id} board={board} />
        ))}
      </div>
      <DynamicModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        config={modalConfigs.addBoard}
        onSubmit={handleSubmit}
        onConfirmed={refetch}
      />
    </div>
  );
}
