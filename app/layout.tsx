'use client';
import './globals.css';
import { ReactNode } from 'react';
import Web3Providers from '@/providers/Web3Providers';
import { Toaster } from "@/components/ui/toaster"

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <html>
        <head>
          <title>Boundy Board</title>
        </head>
        <body>
          <Web3Providers>
            {children}
          </Web3Providers>
          <Toaster />
        </body>
      </html>
    </>
  );
};

export default RootLayout;
