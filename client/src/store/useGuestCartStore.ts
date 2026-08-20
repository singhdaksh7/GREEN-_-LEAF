import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  productId: string;
  variantSku: string | null;
  quantity: number;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  mrp: number;
  variant: Record<string, string> | null;
  stock: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateQuantity: (productId: string, variantSku: string | null, quantity: number) => void;
  removeItem: (productId: string, variantSku: string | null) => void;
  clear: () => void;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantSku === item.variantSku
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      updateQuantity: (productId, variantSku, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => !(i.productId === productId && i.variantSku === variantSku))
              : state.items.map((i) =>
                  i.productId === productId && i.variantSku === variantSku ? { ...i, quantity } : i
                ),
        })),
      removeItem: (productId, variantSku) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.variantSku === variantSku)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'green-leaf-guest-cart' }
  )
);
