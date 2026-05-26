import { create } from 'zustand';

interface PreloaderState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const usePreloaderStore = create<PreloaderState>((set) => ({
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
}));
