import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestWishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  clear: () => void;
}

export const useGuestWishlistStore = create<GuestWishlistState>()(
  persist(
    (set) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'green-leaf-guest-wishlist' }
  )
);
