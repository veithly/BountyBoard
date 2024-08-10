"use client";

import AddBoardModal from "@/components/AddBoardModal";
import { useState } from "react";
import Boards from "@/components/Boards";
import { Button } from "@/components/ui/button";

// Convert HomePage to a Client Component
export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <Button className="mb-4" onClick={() => setIsModalOpen(true)}>Add Board</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Boards />
      </div>
      <AddBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
