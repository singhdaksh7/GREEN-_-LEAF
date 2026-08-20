import { z } from 'zod';

export const addCartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    variantSku: z.string().nullable().optional(),
    quantity: z.number().int().positive().default(1),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    variantSku: z.string().nullable().optional(),
    quantity: z.number().int().min(0),
  }),
});
