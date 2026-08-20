import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(1),
      phone: z.string().min(10),
      email: z.string().email(),
      addressLine: z.string().min(1),
      locality: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      pincode: z.string().min(4),
    }),
    paymentMethod: z.enum(['COD', 'ONLINE']),
    couponCode: z.string().nullable().optional(),
  }),
});

export const trackOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().min(1),
    contact: z.string().min(3),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED',
    ]),
    note: z.string().optional(),
  }),
});
