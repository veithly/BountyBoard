'use client';
import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from '@/providers/Web3Providers';
import { Toaster } from "@/components/ui/toaster"
import ConnectWallet from '@/components/ConnectWalletButton';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <html>
        <head>
          <title>Boundy Board</title>
        </head>
        <body>
          <Web3Providers>
          <div className="flex justify-between items-center p-4">
            <h1 className="text-3xl font-bold">Bounty Boards</h1>
            <ConnectWallet />
          </div>
            {children}
          </Web3Providers>
          <Toaster />
        </body>
      </html>
    </>
  );
};

export default RootLayout;
