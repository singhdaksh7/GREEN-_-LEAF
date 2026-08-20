import { z } from 'zod';

export const createBulkOrderSchema = z.object({
  body: z.object({
    fullName: z.string().min(1),
    company: z.string().optional(),
    email: z.string().email(),
    mobile: z.string().min(10),
    pincode: z.string().min(4),
    product: z.string().optional(),
    quantity: z.number().int().positive(),
    targetPrice: z.number().positive().optional(),
    expectedPurchaseDate: z.string().optional(),
    requirement: z.string().optional(),
    message: z.string().optional(),
  }),
});
