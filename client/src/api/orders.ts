import { api } from './axios';
import { ApiSuccess, Order } from '@/types';

export interface ShippingAddressInput {
  fullName: string; phone: string; email: string; addressLine: string;
  locality: string; city: string; state: string; pincode: string;
}

export async function placeOrderRequest(payload: {
  shippingAddress: ShippingAddressInput;
  paymentMethod: 'COD' | 'ONLINE';
  couponCode: string | null;
}): Promise<Order> {
  const res = await api.post<ApiSuccess<Order>>('/orders', payload);
  return res.data.data;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const res = await api.get<ApiSuccess<Order[]>>('/orders');
  return res.data.data;
}

export async function fetchMyOrder(id: string): Promise<Order> {
  const res = await api.get<ApiSuccess<Order>>(`/orders/${id}`);
  return res.data.data;
}

export async function trackOrderRequest(orderNumber: string, contact: string): Promise<Order> {
  const res = await api.post<ApiSuccess<Order>>('/orders/track', { orderNumber, contact });
  return res.data.data;
}
