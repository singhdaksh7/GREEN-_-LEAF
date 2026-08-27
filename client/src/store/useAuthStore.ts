import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isRestoring: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  finishRestoring: () => void;
  logout: () => void;
}

// Auth state is intentionally memory-only. A fresh page load is restored from
// the httpOnly cookies by AuthSessionRestorer, never from localStorage.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isRestoring: true,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  finishRestoring: () => set({ isRestoring: false }),
  logout: () => set({ user: null, accessToken: null, isRestoring: false }),
}));
