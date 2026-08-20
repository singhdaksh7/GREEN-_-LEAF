import { api } from './axios';
import { ApiSuccess, Category } from '@/types';

export async function fetchCategoryTree(): Promise<Category[]> {
  const res = await api.get<ApiSuccess<Category[]>>('/categories');
  return res.data.data;
}

export async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const res = await api.get<ApiSuccess<Category>>(`/categories/${slug}`);
  return res.data.data;
}
