import { describe, it, expect } from 'vitest';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from '../src/validators/payment.validators';

const validAddress = {
  fullName: 'Jane Doe',
  phone: '9876543210',
  email: 'jane@example.com',
  addressLine: '123 Garden Lane',
  locality: 'Green Park',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

describe('createRazorpayOrderSchema', () => {
  it('accepts a valid payload with a coupon code', () => {
    const result = createRazorpayOrderSchema.safeParse({
      body: { shippingAddress: validAddress, couponCode: 'SAVE10' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload without a coupon code', () => {
    const result = createRazorpayOrderSchema.safeParse({ body: { shippingAddress: validAddress } });
    expect(result.success).toBe(true);
  });

  it('rejects a payload missing required address fields', () => {
    const { pincode: _pincode, ...incomplete } = validAddress;
    const result = createRazorpayOrderSchema.safeParse({ body: { shippingAddress: incomplete } });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email in the shipping address', () => {
    const result = createRazorpayOrderSchema.safeParse({
      body: { shippingAddress: { ...validAddress, email: 'not-an-email' } },
    });
    expect(result.success).toBe(false);
  });
});

describe('verifyRazorpayPaymentSchema', () => {
  it('accepts a complete verification payload', () => {
    const result = verifyRazorpayPaymentSchema.safeParse({
      body: {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'deadbeef',
      },
    });
    expect(result.success).toBe(true);
  });

  it.each(['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'])(
    'rejects a payload missing %s',
    (field) => {
      const body: Record<string, string> = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'deadbeef',
      };
      delete body[field];
      const result = verifyRazorpayPaymentSchema.safeParse({ body });
      expect(result.success).toBe(false);
    }
  );
});
