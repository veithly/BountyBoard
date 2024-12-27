'use client';

import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from '@/providers/Web3Providers';
import { Toaster } from "@/components/ui/toaster";
import ConnectWallet from '@/components/ConnectWalletButton';
import Link from 'next/link';
import Image from 'next/image';
import { SessionProvider } from "next-auth/react";
import Navigation from '@/components/Navigation';
import { TelegramAuthProvider } from '@/providers/TelegramAuthContext';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html>
      <head>
        <title>Bounty Board</title>
      </head>
      <body>
        <SessionProvider>
          <Web3Providers>
            <TelegramAuthProvider>
              <div className="bg-black/40 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
                <div className="container mx-auto py-4">
                  <div className="flex items-center justify-between">
                    <Link href="/">
                      <div className="flex items-center group">
                        <div className="relative">
                          <Image
                            src='/logo.svg'
                            alt='logo'
                            width={40}
                            height={40}
                            className="mr-1 transform group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full group-hover:bg-purple-500/30 transition-colors duration-300" />
                        </div>
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 hover:from-purple-500 hover:via-purple-700 hover:to-purple-900 transition-all duration-300 transform hover:scale-105">
                          BountyBoard
                        </h1>
                      </div>
                    </Link>
                    <Navigation />
                    <div className="ml-auto">
                      <ConnectWallet />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                {children}
              </div>
            </TelegramAuthProvider>
          </Web3Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;