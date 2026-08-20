import { api } from './axios';
import { ApiSuccess, User } from '@/types';

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function registerRequest(payload: {
  firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string;
}): Promise<AuthResponse> {
  const res = await api.post<ApiSuccess<AuthResponse>>('/auth/register', payload);
  return res.data.data;
}

export async function loginRequest(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await api.post<ApiSuccess<AuthResponse>>('/auth/login', payload);
  return res.data.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<ApiSuccess<User>>('/auth/me');
  return res.data.data;
}

export async function changePasswordRequest(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await api.patch('/auth/password', payload);
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPasswordRequest(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}
