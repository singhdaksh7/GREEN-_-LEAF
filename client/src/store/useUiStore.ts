import { create } from 'zustand';

interface UiState {
  isCartDrawerOpen: boolean;
  isMobileNavOpen: boolean;
  quickViewProductSlug: string | null;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleMobileNav: (open?: boolean) => void;
  openQuickView: (slug: string) => void;
  closeQuickView: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCartDrawerOpen: false,
  isMobileNavOpen: false,
  quickViewProductSlug: null,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleMobileNav: (open) => set((state) => ({ isMobileNavOpen: open ?? !state.isMobileNavOpen })),
  openQuickView: (slug) => set({ quickViewProductSlug: slug }),
  closeQuickView: () => set({ quickViewProductSlug: null }),
}));
