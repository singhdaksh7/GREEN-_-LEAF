import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loginRequest, logoutRequest, registerRequest } from '@/api/auth';
import { addCartItem } from '@/api/cart';
import { addToWishlistRequest } from '@/api/wishlist';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useGuestWishlistStore } from '@/store/useGuestWishlistStore';
import { getErrorMessage } from '@/api/axios';

async function mergeGuestState() {
  const guestCart = useGuestCartStore.getState();
  const guestWishlist = useGuestWishlistStore.getState();

  for (const item of guestCart.items) {
    try {
      await addCartItem({ productId: item.productId, variantSku: item.variantSku, quantity: item.quantity });
    } catch {
      // Skip items that fail to merge (e.g. now out of stock); user can re-add manually.
    }
  }
  guestCart.clear();

  for (const productId of guestWishlist.productIds) {
    try {
      await addToWishlistRequest(productId);
    } catch {
      // ignore
    }
  }
  guestWishlist.clear();
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async ({ user, accessToken }) => {
      setAuth(user, accessToken);
      await mergeGuestState();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(`Welcome back, ${user.firstName}!`);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Login failed')),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: async ({ user, accessToken }) => {
      setAuth(user, accessToken);
      await mergeGuestState();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Account created successfully!');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Registration failed')),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
  });
}
