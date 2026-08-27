import { api } from './axios';
import { ApiSuccess, Address, User } from '@/types';

export async function updateProfileRequest(payload: { name: string }): Promise<User> {
  const res = await api.patch<ApiSuccess<User>>('/account/profile', payload);
  return res.data.data;
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await api.get<ApiSuccess<Address[]>>('/account/addresses');
  return res.data.data;
}

export type AddressInput = Omit<Address, '_id'>;

export async function createAddressRequest(payload: AddressInput): Promise<Address> {
  const res = await api.post<ApiSuccess<Address>>('/account/addresses', payload);
  return res.data.data;
}

export async function updateAddressRequest(id: string, payload: Partial<AddressInput>): Promise<Address> {
  const res = await api.patch<ApiSuccess<Address>>(`/account/addresses/${id}`, payload);
  return res.data.data;
}

export async function deleteAddressRequest(id: string): Promise<void> {
  await api.delete(`/account/addresses/${id}`);
}
