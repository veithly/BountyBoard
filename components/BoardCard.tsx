'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useTokenSymbol } from '@/hooks/useContract';
import { BoardView } from '@/types/types';
import { formatUnits, zeroAddress } from 'viem';
import { Address } from './ui/Address';
import { User2, Calendar, Coins } from 'lucide-react';

export default function BoardCard({
  board,
  creatorProfile
}: {
  board: BoardView;
  creatorProfile?: {
    nickname: string;
    avatar: string;
  }
}) {
  const { data: tokenSymbol } = useTokenSymbol(board.rewardToken);

  return (
    <Link key={board.id} href={`/board/${board.id}`}>
      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
        <CardHeader>
          <div className="flex items-center gap-4">
            {board.img && (
              <div className="relative w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={board.img}
                  alt={board.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.png';
                  }}
                />
              </div>
            )}
            <CardTitle className="break-words line-clamp-2 h-8">{board.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground min-h-[3rem] break-words line-clamp-2">
            {board.description}
          </p>
          <div className="flex justify-between items-center text-xs mt-4 text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              {creatorProfile?.avatar ? (
                <Image
                  src={creatorProfile.avatar}
                  alt="Creator"
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
              ) : (
                <User2 className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">
                {creatorProfile?.nickname || <Address address={board.creator} />}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="h-4 w-4" />
              {format(new Date(Number(board.createdAt) * 1000), 'PPP')}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Coins className="h-4 w-4" />
              <span className="truncate">
                {formatUnits(board.totalPledged, 18)} {tokenSymbol ?? ((board.rewardToken === zeroAddress && 'ETH') || '')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
