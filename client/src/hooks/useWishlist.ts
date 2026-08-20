import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addToWishlistRequest, fetchWishlist, removeFromWishlistRequest } from '@/api/wishlist';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestWishlistStore } from '@/store/useGuestWishlistStore';

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestWishlist = useGuestWishlistStore();

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  });

  const productIds = isAuthenticated
    ? (wishlistQuery.data?.products.map((p) => p._id) ?? [])
    : guestWishlist.productIds;

  const products = isAuthenticated ? (wishlistQuery.data?.products ?? []) : [];

  return { productIds, products, isLoading: wishlistQuery.isLoading, isAuthenticated };
}

export function useToggleWishlist() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));
  const guestWishlist = useGuestWishlistStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isSaved }: { productId: string; isSaved: boolean }) => {
      if (isAuthenticated) {
        return isSaved ? removeFromWishlistRequest(productId) : addToWishlistRequest(productId);
      }
      guestWishlist.toggle(productId);
      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(variables.isSaved ? 'Removed from wishlist' : 'Added to wishlist');
    },
  });
}
