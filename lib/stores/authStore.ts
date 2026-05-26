import { create } from 'zustand';
import { Profile } from '@/types';

interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setProfile: (profile: Profile | null) => void;
  clearProfile: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  setProfile: (profile) => set({ profile, isAuthenticated: !!profile, isLoading: false }),
  clearProfile: () => set({ profile: null, isAuthenticated: false, isLoading: false }),
}));
