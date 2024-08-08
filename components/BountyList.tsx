// components/BountyList.tsx
'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns';

interface BountyListProps {
  bounties: any[];
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

  const isCreator = bounties.some(bounty => bounty.creator === address);

  return (
    <ul>
      {bounties.map((bounty) => (
        <li key={bounty.id} className="mb-4">
          {/* Bounty Details */}
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => onBountySelect(bounty)}
          >
            <div>
              <h3 className="font-bold">{bounty.description}</h3>
              <p>Creator: {bounty.creator}</p>
              <p>Reward: {bounty.rewardAmount}</p>
              <p>Created: {format(new Date(bounty.createdAt * 1000), 'PPP')}</p>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
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
            </DropdownMenu>
          </div>
        </li>
      ))}
    </ul>
  );
}
