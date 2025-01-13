import { create } from 'zustand';
import { SocialAccount } from '@/types/profile';

interface UserStore {
  socialAccounts: SocialAccount | null;
  setSocialAccounts: (accounts: SocialAccount | ((prev: SocialAccount | null) => SocialAccount)) => void;
  clearSocialAccounts: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  socialAccounts: null,
  setSocialAccounts: (accounts) => set((state) => ({
    socialAccounts: typeof accounts === 'function' ? accounts(state.socialAccounts) : accounts
  })),
  clearSocialAccounts: () => set({ socialAccounts: null }),
}));
