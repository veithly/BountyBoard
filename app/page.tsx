"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import DynamicModal from "@/components/DynamicModal";
import { useCreateBoard, useGetAllBoards } from "@/hooks/useContract";
import { type BoardView } from "@/types/types";
import BoardCard from "@/components/BoardCard";

const modalConfigs = {
  addBoard: {
    title: 'Add New Board',
    description: 'Create a new bounty board with a name, description, and reward token(blank for ETH).',
    fields: [
      { name: 'name', label: 'Board Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'img', label: 'Image', type: 'image' },
      { name: 'rewardToken', label: 'Reward Token Address', type: 'text' },
    ],
  },
};

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const createBoard = useCreateBoard();

  const { data: boardsData, refetch } = useGetAllBoards();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: any) => {
    return await createBoard(data);
  };

  return (
    <div className="container mx-auto p-4">
      <Button className="mb-4" onClick={handleOpenModal}>
        Create Bounty Board
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boardsData && boardsData.map((board: BoardView) => (
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
