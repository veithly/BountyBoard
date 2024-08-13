// components/BountyList.tsx
'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, Coins, MoreHorizontal, User2, UserPlus } from 'lucide-react'
import { format } from 'date-fns';
import { Address } from './ui/Address';
import { formatUnits } from 'viem';
import { Bounty } from '@/types/types';

interface BountyListProps {
  bounties: Bounty[];
  address: string | undefined;
  onBountySelect: (bounty: any) => void;
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

  return (
    <ul className="space-y-4">
      {bounties.map((bounty) => (
        <li key={bounty.id} className="card mb-4 p-4 shadow-lg rounded-lg border border-gray-200">
          {/* Bounty Details */}
          <div
            className="flex justify-between items-center"
            onClick={() => onBountySelect(bounty)}
          >
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

            {/* Actions Dropdown */}
            {address && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
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
            </DropdownMenu>}
          </div>
        </li>
      ))}
    </ul>
  );
}
