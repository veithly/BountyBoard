'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCreateBountyBoard } from '@/hooks/contract';

interface AddBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBoardModal({ isOpen, onClose }: AddBoardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rewardToken, setRewardToken] = useState('');
  const createBountyBoard = useCreateBountyBoard();

  const handleSubmit = async () => {
    try {
      await createBountyBoard({ name, description, rewardToken });
      onClose(); // Close the modal after successful submission
    } catch (error) {
      console.error('Error creating bounty board:', error);
      // Handle error, e.g., display an error message to the user
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Board</DialogTitle>
          <DialogDescription>
            Create a new bounty board with a name, description, and reward token.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Board Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Reward Token Address"
            value={rewardToken}
            onChange={(e) => setRewardToken(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Create Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
