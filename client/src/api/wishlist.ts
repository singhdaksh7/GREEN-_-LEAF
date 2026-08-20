import { api } from './axios';
import { ApiSuccess, Product } from '@/types';

interface WishlistResponse {
  _id: string;
  products: Product[];
}

export async function fetchWishlist(): Promise<WishlistResponse> {
  const res = await api.get<ApiSuccess<WishlistResponse>>('/wishlist');
  return res.data.data;
}

export async function addToWishlistRequest(productId: string): Promise<WishlistResponse> {
  const res = await api.post<ApiSuccess<WishlistResponse>>('/wishlist', { productId });
  return res.data.data;
}

export async function removeFromWishlistRequest(productId: string): Promise<WishlistResponse> {
  const res = await api.delete<ApiSuccess<WishlistResponse>>(`/wishlist/${productId}`);
  return res.data.data;
}
