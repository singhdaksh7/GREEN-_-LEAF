import { api } from './axios';
import { ApiSuccess } from '@/types';

export interface CouponValidation {
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  discount: number;
  freeShipping: boolean;
  subtotal: number;
}

export async function validateCouponRequest(code: string): Promise<CouponValidation> {
  const res = await api.post<ApiSuccess<CouponValidation>>('/coupons/validate', { code });
  return res.data.data;
}
