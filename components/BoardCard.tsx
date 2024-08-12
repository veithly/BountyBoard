'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useTokenSymbol } from '@/hooks/contract';
import { Board } from '@/types/types';
import { formatUnits } from 'viem';
import { Address } from './ui/Address';
import { User2, Calendar, Coins } from 'lucide-react';

export default function BoardCard({ board }: { board: Board }) {
  const { data: tokenSymbol } = useTokenSymbol(board.rewardToken);

  return (
    <Link key={board.id} href={`/board/${board.id}`}>
      <Card>
        <CardHeader>
          <CardTitle>{board.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{board.description}</p>
          <div className="flex justify-between items-center text-xs mt-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <User2 className="h-4 w-4" />
              <Address address={board.creator} />
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(parseInt(board.createdAt) * 1000), 'PPP')}
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              {formatUnits(BigInt(board.totalPledged), 18)} {tokenSymbol ?? ''}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
