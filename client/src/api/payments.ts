import { api } from './axios';
import { ApiSuccess, Order } from '@/types';
import { ShippingAddressInput } from './orders';

export interface RazorpayOrderInitData {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
}

export async function createRazorpayOrderRequest(payload: {
  shippingAddress: ShippingAddressInput;
  couponCode: string | null;
}): Promise<RazorpayOrderInitData> {
  const res = await api.post<ApiSuccess<RazorpayOrderInitData>>('/payments/razorpay/create-order', payload);
  return res.data.data;
}

export type VerifyRazorpayPaymentResult = Order | { status: 'PENDING' };

export async function verifyRazorpayPaymentRequest(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyRazorpayPaymentResult> {
  const res = await api.post<ApiSuccess<VerifyRazorpayPaymentResult>>('/payments/razorpay/verify', payload);
  return res.data.data;
}
