'use client';

import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from '@/providers/Web3Providers';
import { Toaster } from "@/components/ui/toaster";
import ConnectWallet from '@/components/ConnectWalletButton';
import Link from 'next/link';
import Image from 'next/image';
import { SessionProvider } from "next-auth/react";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <html>
        <head>
          <title>Bounty Board</title>
        </head>
        <body>
          <SessionProvider>
            <Web3Providers>
              <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 rounded-b-lg shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                  <Link href="/">
                    <div className="flex items-center">
                      <Image src='/logo.png' alt='logo' width={32} height={32} className="mr-2" />
                      <h1 className="text-3xl font-bold text-white text-shadow-lg cursor-pointer">
                        Bounty Board
                      </h1>
                    </div>
                  </Link>
                  <ConnectWallet />
                </div>
              </div>
              {children}
            </Web3Providers>
          </SessionProvider>
          <Toaster />
        </body>
      </html>
    </>
  );
};

export default RootLayout;