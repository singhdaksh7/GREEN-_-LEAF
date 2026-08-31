import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from '@/api/cart';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useSettings } from './useSettings';
import { CartLine, PricedCart, Product, ProductVariant } from '@/types';
import { getErrorMessage } from '@/api/axios';
import { useUiStore } from '@/store/useUiStore';
import { getOrderedImageUrls } from '@/utils/productImage';

function resolveVariant(product: Product, variantSku: string | null): ProductVariant | null {
  if (!variantSku) return null;
  return product.variants.find((v) => v.sku === variantSku) ?? null;
}

export function useCart() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestCart = useGuestCartStore();
  const { data: settings } = useSettings();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: isAuthenticated,
  });

  if (isAuthenticated) {
    const priced: PricedCart = cartQuery.data ?? {
      lines: [],
      subtotal: 0,
      shipping: 0,
      freeShippingThreshold: settings?.freeShippingThreshold ?? 999,
      amountToFreeShipping: settings?.freeShippingThreshold ?? 999,
    };
    return { ...priced, isLoading: cartQuery.isLoading, isAuthenticated, itemCount: priced.lines.reduce((n, l) => n + l.quantity, 0) };
  }

  const freeShippingThreshold = settings?.freeShippingThreshold ?? 999;
  const standardShippingFee = settings?.standardShippingFee ?? 79;
  const lines: CartLine[] = guestCart.items.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    variantSku: item.variantSku,
    name: item.name,
    image: item.image,
    variant: item.variant,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    mrp: item.mrp,
    totalPrice: item.unitPrice * item.quantity,
    stock: item.stock,
    inStock: item.stock >= item.quantity,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  const shipping = subtotal > 0 && subtotal < freeShippingThreshold ? standardShippingFee : 0;

  return {
    lines,
    subtotal,
    shipping,
    freeShippingThreshold,
    amountToFreeShipping: Math.max(0, freeShippingThreshold - subtotal),
    isLoading: false,
    isAuthenticated,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

export function useAddToCart() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestCart = useGuestCartStore();
  const queryClient = useQueryClient();
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);

  return useMutation({
    mutationFn: async ({ product, variantSku, quantity }: { product: Product; variantSku: string | null; quantity: number }) => {
      if (isAuthenticated) {
        return addCartItem({ productId: product._id, variantSku, quantity });
      }
      const variant = resolveVariant(product, variantSku);
      guestCart.addItem({
        productId: product._id,
        variantSku,
        quantity,
        name: product.name,
        slug: product.slug,
        image: variant?.images[0] ?? getOrderedImageUrls(product)[0] ?? '',
        unitPrice: variant?.salePrice ?? product.salePrice,
        mrp: variant?.mrp ?? product.mrp,
        variant: variant?.attributes ?? null,
        stock: variant?.stock ?? product.stock,
      });
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
      openCartDrawer();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not add item to cart')),
  });
}

export function useUpdateCartItem() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestCart = useGuestCartStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantSku, quantity }: { productId: string; variantSku: string | null; quantity: number }) => {
      if (isAuthenticated) return updateCartItem({ productId, variantSku, quantity });
      guestCart.updateQuantity(productId, variantSku, quantity);
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update cart')),
  });
}

export function useRemoveCartItem() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestCart = useGuestCartStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantSku }: { productId: string; variantSku: string | null }) => {
      if (isAuthenticated) return removeCartItem(productId, variantSku);
      guestCart.removeItem(productId, variantSku);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
  });
}
