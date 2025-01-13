'use client';

import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AddressProps {
  address: `0x${string}`
  className?: string
  size?: 'sm' | 'lg'
}
// Function to abbreviate the middle part of the address
function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Address({ address, className, size = 'sm' }: AddressProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <code
            className={cn(
              'relative rounded bg-muted px-1 py-[0.2rem] font-mono text-sm font-semibold',
              size === 'sm' && 'text-[0.625rem] leading-4',
              size === 'lg' && 'text-base leading-6',
              className
            )}
          >
            {shortenAddress(address)}
          </code>
        </TooltipTrigger>
        <TooltipContent>
          <p>{address}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface TipProps {
  tip: string
  children: React.ReactNode
}

export function Tip({ tip, children }: TipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}