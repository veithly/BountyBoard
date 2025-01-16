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
import { getNativeTokenSymbol } from '@/utils/chain';
import { useAccount } from 'wagmi';

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
  const { chain } = useAccount();
  const { data: tokenSymbol } = useTokenSymbol(board.rewardToken);

  return (
    <Link key={board.id} href={`/board/${board.id}`}>
      <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] h-full">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            {board.img && (
              <div className="relative w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-lg flex-shrink-0">
                <Image
                  src={board.img}
                  alt={board.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 40px, 48px"
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.png';
                  }}
                />
              </div>
            )}
            <CardTitle className="break-words line-clamp-2 text-base md:text-lg">
              {board.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <p className="text-sm text-muted-foreground min-h-[2rem] line-clamp-2 mb-3">
            {board.description}
          </p>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(Number(board.createdAt) * 1000), 'PPP')}
              </div>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4" />
                <span className="truncate">
                  {formatUnits(board.totalPledged, 18)} {tokenSymbol ?? ((board.rewardToken === zeroAddress && getNativeTokenSymbol(chain)) || '')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
