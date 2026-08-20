import { api } from './axios';
import { ApiSuccess, PricedCart } from '@/types';

export async function fetchCart(): Promise<PricedCart> {
  const res = await api.get<ApiSuccess<PricedCart>>('/cart');
  return res.data.data;
}

export async function addCartItem(payload: { productId: string; variantSku: string | null; quantity: number }): Promise<PricedCart> {
  const res = await api.post<ApiSuccess<PricedCart>>('/cart/items', payload);
  return res.data.data;
}

export async function updateCartItem(payload: { productId: string; variantSku: string | null; quantity: number }): Promise<PricedCart> {
  const res = await api.patch<ApiSuccess<PricedCart>>('/cart/items', payload);
  return res.data.data;
}

export async function removeCartItem(productId: string, variantSku: string | null): Promise<PricedCart> {
  const res = await api.delete<ApiSuccess<PricedCart>>(`/cart/items/${productId}`, { params: { variantSku } });
  return res.data.data;
}
