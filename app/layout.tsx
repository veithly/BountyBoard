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
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const RootLayout = ({ children }: { children: ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <html>
      <head>
        <title>Bounty Board</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <SessionProvider>
          <Web3Providers>
            <TelegramAuthProvider>
              {/* Header */}
              <div className="bg-black/40 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
                <div className="container mx-auto py-2 md:py-4 px-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="flex-shrink-0">
                      <div className="flex items-center group">
                        <div className="relative">
                          <Image
                            src='/logo.svg'
                            alt='logo'
                            width={32}
                            height={32}
                            className="mr-1 transform group-hover:scale-110 transition-transform duration-300 md:w-10 md:h-10"
                          />
                          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full group-hover:bg-purple-500/30 transition-colors duration-300" />
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 hover:from-purple-500 hover:via-purple-700 hover:to-purple-900 transition-all duration-300 transform hover:scale-105">
                          BountyBoard
                        </h1>
                      </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                      <Navigation />
                    </div>

                    {/* Connect Wallet Button */}
                    <div className="flex items-center gap-2">
                      <ConnectWallet />
                      {/* Mobile Menu Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                <div
                  className={cn(
                    "md:hidden overflow-hidden transition-all duration-300 border-t border-purple-500/20 bg-black/60 backdrop-blur-lg",
                    isMenuOpen ? "max-h-64" : "max-h-0"
                  )}
                >
                  <div className="container mx-auto py-4 px-4">
                    <Navigation mobile onClose={() => setIsMenuOpen(false)} />
                  </div>
                </div>
              </div>

              <main className="min-h-[calc(100vh-4rem)]">
                {children}
              </main>
            </TelegramAuthProvider>
          </Web3Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
};

export default RootLayout;