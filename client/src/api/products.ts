import { api } from './axios';
import { ApiSuccess, PaginatedResult, Product, Review } from '@/types';

export interface ProductListParams {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  minDiscount?: number;
  brand?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchProducts(params: ProductListParams): Promise<PaginatedResult<Product>> {
  const res = await api.get<ApiSuccess<PaginatedResult<Product>>>('/products', { params });
  return res.data.data;
}

export async function fetchProductBySlug(slug: string): Promise<{ product: Product; related: Product[]; reviews: Review[] }> {
  const res = await api.get<ApiSuccess<{ product: Product; related: Product[]; reviews: Review[] }>>(`/products/${slug}`);
  return res.data.data;
}
