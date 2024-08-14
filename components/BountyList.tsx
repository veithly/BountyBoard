// components/BountyList.tsx
'use client';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Calendar, 
  Clock, 
  Coins, 
  MoreHorizontal, 
  User2, 
  UserPlus 
} from 'lucide-react'
import { format } from 'date-fns';
import { Address } from './ui/Address';
import { formatUnits } from 'viem';
import { Bounty } from '@/types/types';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';

interface BountyListProps {
  bounties: Bounty[];
  address: string | undefined;
  onBountySelect: (bounty: Bounty) => void;
  onOpenSubmitProofModal: (bountyId: string) => void;
  onOpenAddReviewerModal: (bountyId: string) => void;
  onOpenUpdateBountyModal: (bountyId: string) => void;
  onCancelBounty: (bountyId: string) => void;
}

export default function BountyList({
  bounties,
  address,
  onBountySelect,
  onOpenSubmitProofModal,
  onOpenAddReviewerModal,
  onOpenUpdateBountyModal,
  onCancelBounty
}: BountyListProps) {

  const isCreator = bounties.some(bounty => bounty.creator === address?.toLowerCase());
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>(
    bounties.reduce((acc, bounty) => ({ ...acc, [bounty.id]: Number(bounty.deadline) - Date.now() }), {})
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTimes(prevTimes =>
        bounties.reduce((acc, bounty) => ({
          ...acc,
          [bounty.id]: prevTimes[bounty.id] > 0 ? prevTimes[bounty.id] - 1000 : 0
        }), {})
      );
    }, 1000);
    return () => clearInterval(intervalId);
  }, [bounties]);

  return (
    <ul className="space-y-4">
      {bounties.map((bounty) => {
        const isExpired = Date.now() > Number(bounty.deadline);
        const remainingTime = Number(bounty.deadline) - Date.now(); 
        const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        return (
          <li key={bounty.id} className="relative card mb-4 p-4 shadow-lg rounded-lg border border-gray-200">
            {/* Actions Dropdown (Top Right) */}
            {address && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="absolute top-4 right-4">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Submit Proof (available to all logged-in users) */}
                  {address && (
                    <DropdownMenuItem onClick={() => onOpenSubmitProofModal(bounty.id)}>
                      Submit Proof
                    </DropdownMenuItem>
                  )}

                  {/* Creator Actions */}
                  {isCreator && (
                    <>
                      <DropdownMenuItem onClick={() => onOpenAddReviewerModal(bounty.id)}>
                        Add Reviewer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenUpdateBountyModal(bounty.id)}>
                        Update Bounty
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCancelBounty(bounty.id)}>
                        Cancel Bounty
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Bounty Details (Left) */}
            <div className="flex items-start cursor-pointer" onClick={() => onBountySelect(bounty)}>
              <div>
                <h3 className="font-bold">{bounty.description}</h3>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  <Address address={bounty.creator} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="h-4 w-4" />
                  Reward: {formatUnits(BigInt(bounty.rewardAmount), 18)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Max Submissions: {bounty.maxCompletions}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created: {format(
                    new Date(Number(bounty.createdAt) * 1000),
                    'PPP',
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Deadline:{' '}
                  {format(new Date(Number(bounty.deadline)), 'PPP')} 
                </div>
              </div>

              {/* Countdown and Status (Right Bottom) */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end text-xs text-muted-foreground">
                {/* 显示倒计时或徽章 */}
                {!bounty.cancelled && !bounty.completed && (
                  isExpired ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      {days}d {hours}h {minutes}m {seconds}s
                    </motion.div>
                  )
                )}
                
                {/* Bounty Status */}
                <div className="mt-2">
                  {bounty.cancelled && (
                    <Badge variant="destructive">Cancelled</Badge>
                  )}
                  {bounty.completed && (
                    <Badge>Completed</Badge>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
