import { api } from './axios';
import { ApiSuccess, BlogPost } from '@/types';

export async function fetchBlogPosts(page = 1, category?: string): Promise<{ posts: BlogPost[]; page: number; totalPages: number }> {
  const res = await api.get<ApiSuccess<{ posts: BlogPost[]; page: number; totalPages: number }>>('/blog', {
    params: { page, category },
  });
  return res.data.data;
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  const res = await api.get<ApiSuccess<BlogPost>>(`/blog/${slug}`);
  return res.data.data;
}
