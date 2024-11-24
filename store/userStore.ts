import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socialAccount } from '@/types/profile';

interface UserState {
  socialAccounts: socialAccount | null;
  setSocialAccounts: (accounts: socialAccount) => void;
  clearSocialAccounts: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      socialAccounts: null,
      setSocialAccounts: (accounts) => set({ socialAccounts: accounts }),
      clearSocialAccounts: () => set({ socialAccounts: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
