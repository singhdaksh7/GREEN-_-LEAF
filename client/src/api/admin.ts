import { api } from './axios';
import { ApiSuccess, BlogPost, Category, Order, OrderStatus, Product, ProductImage, User } from '@/types';

export interface DashboardStats {
  revenue: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  lowStockProducts: Pick<Product, '_id' | 'name' | 'slug' | 'stock'>[];
  pendingOrders: number;
  recentOrders: Order[];
  pendingInquiries: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiSuccess<DashboardStats>>('/admin/dashboard');
  return res.data.data;
}

export async function fetchAdminProducts(params: { page?: number; q?: string; category?: string; status?: string }) {
  const res = await api.get<ApiSuccess<{ products: Product[]; page: number; total: number; totalPages: number }>>('/admin/products', { params });
  return res.data.data;
}

export async function fetchAdminProduct(id: string): Promise<Product> {
  const res = await api.get<ApiSuccess<Product>>(`/admin/products/${id}`);
  return res.data.data;
}

export async function createAdminProductRequest(payload: Record<string, unknown>): Promise<Product> {
  const res = await api.post<ApiSuccess<Product>>('/admin/products', payload);
  return res.data.data;
}

interface UploadedImageResponse {
  key: string;
  url: string;
  thumbnailKey: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export async function uploadProductImagesRequest(files: File[]): Promise<UploadedImageResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const res = await api.post<ApiSuccess<{ images: UploadedImageResponse[] }>>('/admin/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.images;
}

export function uploadedImageToProductImage(uploaded: UploadedImageResponse, sortOrder: number, isPrimary: boolean): ProductImage {
  return { url: uploaded.url, key: uploaded.key, alt: '', isPrimary, sortOrder };
}

export async function updateAdminProductRequest(id: string, payload: Record<string, unknown>): Promise<Product> {
  const res = await api.patch<ApiSuccess<Product>>(`/admin/products/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminProductRequest(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

export async function fetchAdminCategories(): Promise<Category[]> {
  const res = await api.get<ApiSuccess<Category[]>>('/admin/categories');
  return res.data.data;
}

export async function createAdminCategoryRequest(payload: Record<string, unknown>): Promise<Category> {
  const res = await api.post<ApiSuccess<Category>>('/admin/categories', payload);
  return res.data.data;
}

export async function updateAdminCategoryRequest(id: string, payload: Record<string, unknown>): Promise<Category> {
  const res = await api.patch<ApiSuccess<Category>>(`/admin/categories/${id}`, payload);
  return res.data.data;
}

export async function deleteAdminCategoryRequest(id: string): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

export async function fetchAdminOrders(params: { page?: number; status?: string }) {
  const res = await api.get<ApiSuccess<{ orders: Order[]; page: number; total: number; totalPages: number }>>('/admin/orders', { params });
  return res.data.data;
}

export async function fetchAdminOrder(id: string): Promise<Order> {
  const res = await api.get<ApiSuccess<Order>>(`/admin/orders/${id}`);
  return res.data.data;
}

export async function updateAdminOrderStatusRequest(id: string, status: OrderStatus, note?: string): Promise<Order> {
  const res = await api.patch<ApiSuccess<Order>>(`/admin/orders/${id}/status`, { status, note });
  return res.data.data;
}

export async function fetchAdminCustomers(params: { page?: number; q?: string }) {
  const res = await api.get<ApiSuccess<{ customers: User[]; page: number; total: number; totalPages: number }>>('/admin/customers', { params });
  return res.data.data;
}

export async function setCustomerActiveRequest(id: string, isActive: boolean): Promise<User> {
  const res = await api.patch<ApiSuccess<User>>(`/admin/customers/${id}/active`, { isActive });
  return res.data.data;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export async function fetchAdminCoupons(): Promise<AdminCoupon[]> {
  const res = await api.get<ApiSuccess<AdminCoupon[]>>('/admin/coupons');
  return res.data.data;
}

export async function createAdminCouponRequest(payload: Record<string, unknown>): Promise<AdminCoupon> {
  const res = await api.post<ApiSuccess<AdminCoupon>>('/admin/coupons', payload);
  return res.data.data;
}

export async function disableAdminCouponRequest(id: string): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}

export async function fetchAdminReviews(params: { page?: number; isApproved?: boolean }) {
  const res = await api.get<ApiSuccess<{ reviews: unknown[]; page: number; total: number; totalPages: number }>>('/admin/reviews', { params });
  return res.data.data;
}

export async function setReviewApprovalRequest(id: string, isApproved: boolean): Promise<void> {
  await api.patch(`/admin/reviews/${id}/approval`, { isApproved });
}

export async function fetchAdminBulkOrders(status?: string) {
  const res = await api.get<ApiSuccess<unknown[]>>('/admin/bulk-orders', { params: { status } });
  return res.data.data;
}

export async function updateAdminBulkOrderStatusRequest(id: string, status: string): Promise<void> {
  await api.patch(`/admin/bulk-orders/${id}/status`, { status });
}

export async function fetchAdminBlogPosts(): Promise<BlogPost[]> {
  const res = await api.get<ApiSuccess<BlogPost[]>>('/admin/blog');
  return res.data.data;
}

export async function createAdminBlogPostRequest(payload: Record<string, unknown>): Promise<BlogPost> {
  const res = await api.post<ApiSuccess<BlogPost>>('/admin/blog', payload);
  return res.data.data;
}

export async function updateAdminBlogPostRequest(id: string, payload: Record<string, unknown>): Promise<BlogPost> {
  const res = await api.patch<ApiSuccess<BlogPost>>(`/admin/blog/${id}`, payload);
  return res.data.data;
}

export async function updateAdminSettingsRequest(payload: Record<string, unknown>): Promise<void> {
  await api.patch('/admin/settings', payload);
}
