import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});
