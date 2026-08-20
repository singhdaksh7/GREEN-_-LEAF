import { api } from './axios';
import { ApiSuccess, PaginatedResult, Product } from '@/types';

export async function searchProducts(q: string, page = 1, sort = 'featured'): Promise<PaginatedResult<Product>> {
  const res = await api.get<ApiSuccess<PaginatedResult<Product>>>('/search', { params: { q, page, sort } });
  return res.data.data;
}

export interface SearchSuggestions {
  products: Pick<Product, '_id' | 'name' | 'slug' | 'images' | 'salePrice' | 'mrp'>[];
  categories: { _id: string; name: string; slug: string }[];
}

export async function suggestSearch(q: string): Promise<SearchSuggestions> {
  const res = await api.get<ApiSuccess<SearchSuggestions>>('/search/suggest', { params: { q } });
  return res.data.data;
}
