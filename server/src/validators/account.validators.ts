import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(10),
  }),
});

export const addressSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(10),
    addressLine: z.string().min(1),
    locality: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4),
    isDefault: z.boolean().optional(),
  }),
});
