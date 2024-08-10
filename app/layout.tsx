'use client';

import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from '@/providers/Web3Providers';
import { Toaster } from "@/components/ui/toaster";
import ConnectWallet from '@/components/ConnectWalletButton';
import Link from 'next/link';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <html>
        <head>
          <title>Bounty Board</title>
        </head>
        <body> 
          <Web3Providers>
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-b-lg shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/">
                  <h1 className="text-3xl font-bold text-white text-shadow-lg cursor-pointer"> 
                    Bounty Boards
                  </h1>
                </Link>
                <ConnectWallet />
              </div>
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