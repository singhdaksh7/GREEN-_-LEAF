import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Full name is required').max(100),
    email: z.string().trim().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }).strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});
