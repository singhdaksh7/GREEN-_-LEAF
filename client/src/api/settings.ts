import { api } from './axios';
import { ApiSuccess, SiteSettings } from '@/types';

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await api.get<ApiSuccess<SiteSettings>>('/settings');
  return res.data.data;
}
