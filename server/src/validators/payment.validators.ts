import { z } from 'zod';
import { shippingAddressSchema } from './order.validators';

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    couponCode: z.string().nullable().optional(),
  }),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }),
});
