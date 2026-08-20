import { api } from './axios';
import { ApiSuccess, Review } from '@/types';

export async function fetchReviews(productId: string, page = 1): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
  const res = await api.get<ApiSuccess<{ reviews: Review[]; total: number; totalPages: number }>>('/reviews', {
    params: { productId, page },
  });
  return res.data.data;
}

export async function createReviewRequest(payload: {
  productId: string; rating: number; title: string; description: string;
}): Promise<Review> {
  const res = await api.post<ApiSuccess<Review>>('/reviews', payload);
  return res.data.data;
}
