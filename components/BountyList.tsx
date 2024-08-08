'use client';

import { Button } from '@/components/ui/button';

interface BountyListProps {
  bounties: any[];
  address: string | undefined;
  onOpenSubmitProofModal: (bountyId: string) => void;
}

export default function BountyList({ bounties, address, onOpenSubmitProofModal }: BountyListProps) {
  return (
    <ul>
      {bounties.map((bounty) => (
        <li key={bounty.id} className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">{bounty.description}</h3>
              <p>Creator: {bounty.creator}</p>
              <p>Reward: {bounty.rewardAmount}</p>
              {/* ... other bounty details */}
            </div>
            <Button onClick={() => onOpenSubmitProofModal(bounty.id)}>Submit Proof</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
