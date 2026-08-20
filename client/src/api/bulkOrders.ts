import { api } from './axios';

export interface BulkOrderPayload {
  fullName: string;
  company?: string;
  email: string;
  mobile: string;
  pincode: string;
  product?: string;
  quantity: number;
  targetPrice?: number;
  expectedPurchaseDate?: string;
  requirement?: string;
  message?: string;
}

export async function submitBulkOrderRequest(payload: BulkOrderPayload): Promise<void> {
  await api.post('/bulk-orders', payload);
}
