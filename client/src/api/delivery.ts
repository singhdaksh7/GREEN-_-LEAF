import { api } from './axios';
import { ApiSuccess } from '@/types';

export interface DeliveryCheckResult {
  pincode: string;
  serviceable: boolean;
  estimatedDays: string;
  codAvailable: boolean;
  message: string;
}

export async function checkPincodeRequest(pincode: string): Promise<DeliveryCheckResult> {
  const res = await api.get<ApiSuccess<DeliveryCheckResult>>('/delivery/check', { params: { pincode } });
  return res.data.data;
}
