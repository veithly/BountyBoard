'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

type TelegramAuthContextType = {
  userID: number | null;
  username: string | null;
  windowHeight: number;
  isInitialized: boolean;
};

const TelegramAuthContext = createContext<TelegramAuthContextType | undefined>(undefined);

export const TelegramAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const [userID, setUserID] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Ensure this code only runs on the client side
    if (typeof window !== 'undefined') {
      try {
        // Check if we're in a Telegram WebApp environment
        if ('Telegram' in window && WebApp) {
          WebApp.isVerticalSwipesEnabled = false;
          setWindowHeight(WebApp.viewportStableHeight || window.innerHeight);
          WebApp.ready();

          // Set Telegram user data
          const user = WebApp.initDataUnsafe.user;
          if (user) {
            setUserID(user.id || null);
            setUsername(user.username || null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  const contextValue = {
    userID,
    username,
    windowHeight,
    isInitialized
  };

  return (
    <TelegramAuthContext.Provider value={contextValue}>
      {children}
    </TelegramAuthContext.Provider>
  );
};

export const useTelegramAuth = () => {
  const context = useContext(TelegramAuthContext);
  if (context === undefined) {
    throw new Error('useTelegramAuth must be used within a TelegramAuthProvider');
  }
  return context;
};