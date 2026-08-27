import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const intents = new Map<string, any>();
  const products = new Map<string, any>();
  const coupons = new Map<string, any>();
  const orders: any[] = [];

  return {
    intents,
    products,
    coupons,
    orders,
    reset() {
      intents.clear();
      products.clear();
      coupons.clear();
      orders.length = 0;
    },
  };
});

vi.mock('../src/models/PaymentIntent', () => ({
  PaymentIntent: {
    create: vi.fn(async (doc: any) => {
      const id = `intent_${mocks.intents.size + 1}`;
      const record = { order: null, razorpayPaymentId: null, failureReason: null, createdAt: new Date(), ...doc, _id: id };
      mocks.intents.set(doc.razorpayOrderId, record);
      return record;
    }),
    findOne: vi.fn(async (query: any) => {
      if (query.razorpayOrderId) return mocks.intents.get(query.razorpayOrderId) ?? null;
      return null;
    }),
    findById: vi.fn(async (id: any) => {
      for (const v of mocks.intents.values()) if (v._id === id) return v;
      return null;
    }),
    findOneAndUpdate: vi.fn(async (filter: any, update: any) => {
      let record: any = null;
      for (const v of mocks.intents.values()) if (v._id === filter._id) record = v;
      if (!record) return null;
      if (filter.status && record.status !== filter.status) return null;
      Object.assign(record, update.$set);
      return { ...record };
    }),
    updateOne: vi.fn(async (filter: any, update: any) => {
      let record: any = null;
      for (const v of mocks.intents.values()) if (v._id === filter._id) record = v;
      if (!record) return { matchedCount: 0 };
      Object.assign(record, update.$set);
      return { matchedCount: 1 };
    }),
  },
}));

vi.mock('../src/models/Order', () => ({
  Order: {
    create: vi.fn(async (doc: any) => {
      const record = { ...doc, _id: `order_${mocks.orders.length + 1}` };
      mocks.orders.push(record);
      return record;
    }),
    findById: vi.fn(async (id: any) => mocks.orders.find((o) => o._id === id) ?? null),
  },
}));

vi.mock('../src/models/Product', () => ({
  Product: {
    findOneAndUpdate: vi.fn(async (filter: any) => {
      const product = mocks.products.get(String(filter._id));
      if (!product) return null;
      if (filter.variants) {
        const { sku, stock } = filter.variants.$elemMatch;
        const variant = product.variants.find((v: any) => v.sku === sku);
        if (!variant || variant.stock < stock.$gte) return null;
        variant.stock -= stock.$gte;
        return product;
      }
      if (product.stock < filter.stock.$gte) return null;
      product.stock -= filter.stock.$gte;
      return product;
    }),
  },
}));

vi.mock('../src/models/Coupon', () => ({
  Coupon: {
    findOne: vi.fn(async (query: any) => mocks.coupons.get(query.code) ?? null),
  },
}));

vi.mock('../src/services/cart.service', () => ({
  getOrCreateCart: vi.fn(async () => ({ items: [{ product: 'prod1', variantSku: null, quantity: 2 }] })),
  priceCart: vi.fn(async () => ({
    lines: [
      {
        productId: 'prod1',
        slug: 'garden-hose',
        variantSku: null,
        name: 'Garden Hose',
        image: 'hose.jpg',
        variant: null,
        quantity: 2,
        unitPrice: 100,
        mrp: 120,
        totalPrice: 200,
        stock: mocks.products.get('prod1')?.stock ?? 10,
        inStock: (mocks.products.get('prod1')?.stock ?? 10) >= 2,
      },
    ],
    subtotal: 200,
    shipping: 79,
    freeShippingThreshold: 999,
    amountToFreeShipping: 799,
  })),
  clearCart: vi.fn(async () => {}),
}));

vi.mock('../src/utils/razorpay', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/razorpay')>('../src/utils/razorpay');
  return { ...actual, getRazorpayClient: vi.fn() };
});

const USER_ID = 'user_1';
const OTHER_USER_ID = 'user_2';

function seedProduct(overrides: Partial<{ stock: number }> = {}) {
  mocks.products.set('prod1', { _id: 'prod1', name: 'Garden Hose', stock: 10, variants: [], ...overrides });
}

async function loadService() {
  vi.resetModules();
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  const razorpayUtil = await import('../src/utils/razorpay');
  const service = await import('../src/services/payment.service');
  const { PaymentIntent } = await import('../src/models/PaymentIntent');
  const { Order } = await import('../src/models/Order');
  const { Product } = await import('../src/models/Product');
  return { service, razorpayUtil, PaymentIntent, Order, Product };
}

function signPayload(secret: string, orderId: string, paymentId: string) {
  const crypto = require('node:crypto');
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('payment.service', () => {
  beforeEach(() => {
    mocks.reset();
    seedProduct();
  });

  describe('createRazorpayOrder', () => {
    it('throws when Razorpay is not configured', async () => {
      const { service, razorpayUtil } = await loadService();
      vi.mocked(razorpayUtil.getRazorpayClient).mockImplementation(() => {
        throw new Error('Razorpay is not configured on this server');
      });

      await expect(
        service.createRazorpayOrder(USER_ID, addressFixture(), null)
      ).rejects.toThrow(/not configured/i);
    });

    it('rejects when the cart is empty', async () => {
      const { service } = await loadService();
      const cartService = await import('../src/services/cart.service');
      vi.mocked(cartService.getOrCreateCart).mockResolvedValueOnce({ items: [] } as any);

      await expect(service.createRazorpayOrder(USER_ID, addressFixture(), null)).rejects.toThrow(/cart is empty/i);
    });

    it('rejects when a cart line is out of stock', async () => {
      const { service } = await loadService();
      const cartService = await import('../src/services/cart.service');
      vi.mocked(cartService.priceCart).mockResolvedValueOnce({
        lines: [{ ...baseLine(), inStock: false, name: 'Garden Hose' }],
        subtotal: 200,
        shipping: 79,
        freeShippingThreshold: 999,
        amountToFreeShipping: 799,
      } as any);

      await expect(service.createRazorpayOrder(USER_ID, addressFixture(), null)).rejects.toThrow(/insufficient stock/i);
    });

    it('creates a Razorpay order for the server-calculated amount, converted to paise', async () => {
      const { service, razorpayUtil } = await loadService();
      const create = vi.fn().mockResolvedValue({ id: 'order_rzp_1' });
      vi.mocked(razorpayUtil.getRazorpayClient).mockReturnValue({ orders: { create } } as any);

      const result = await service.createRazorpayOrder(USER_ID, addressFixture(), null);

      // subtotal 200 + shipping 79 = 279 rupees => 27900 paise
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ amount: 27900, currency: 'INR' }));
      expect(result).toEqual(expect.objectContaining({ orderId: 'order_rzp_1', amount: 27900, currency: 'INR' }));
    });
  });

  describe('verifyAndFinalizePayment', () => {
    async function createIntent(service: any, razorpayUtil: any, couponCode: string | null = null) {
      const create = vi.fn().mockResolvedValue({ id: 'order_rzp_1' });
      vi.mocked(razorpayUtil.getRazorpayClient).mockReturnValue({ orders: { create } } as any);
      if (couponCode) {
        mocks.coupons.set(couponCode, { code: couponCode, type: 'FLAT', value: 20, minOrderValue: 0, maxDiscount: null, expiresAt: null, usageLimit: null, usedCount: 0, isActive: true, save: vi.fn(async function (this: any) {}) });
      }
      await service.createRazorpayOrder(USER_ID, addressFixture(), couponCode);
      return 'order_rzp_1';
    }

    it('finalizes the order on a valid signature, decrementing stock once and incrementing coupon usage once', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil, 'SAVE20');
      const paymentId = 'pay_1';
      const signature = signPayload('test_secret', razorpayOrderId, paymentId);

      const order = await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      expect(order.paymentStatus).toBe('PAID');
      expect(order.paymentMethod).toBe('ONLINE');
      expect(mocks.products.get('prod1').stock).toBe(8); // decremented exactly once (10 -> 8 for qty 2)
      expect(mocks.coupons.get('SAVE20').usedCount).toBe(1);
      expect(mocks.orders).toHaveLength(1);
    });

    it('rejects an invalid signature without touching stock or creating an order', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);

      await expect(
        service.verifyAndFinalizePayment(USER_ID, {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'f'.repeat(64),
        })
      ).rejects.toThrow(/verification failed/i);

      expect(mocks.products.get('prod1').stock).toBe(10);
      expect(mocks.orders).toHaveLength(0);
    });

    it('rejects verification attempted by a user who does not own the payment', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);
      const paymentId = 'pay_1';
      const signature = signPayload('test_secret', razorpayOrderId, paymentId);

      await expect(
        service.verifyAndFinalizePayment(OTHER_USER_ID, {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        })
      ).rejects.toThrow(/does not belong to you/i);

      expect(mocks.orders).toHaveLength(0);
    });

    it('is idempotent on duplicate verification requests for the same payment', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);
      const paymentId = 'pay_1';
      const signature = signPayload('test_secret', razorpayOrderId, paymentId);

      const first = await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
      const second = await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      expect(second._id).toBe(first._id);
      expect(mocks.orders).toHaveLength(1);
      expect(mocks.products.get('prod1').stock).toBe(8); // still only decremented once
    });

    it('returns the existing order for a payment that was already finalized (already-paid order)', async () => {
      const { service, razorpayUtil, PaymentIntent } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);
      const paymentId = 'pay_1';
      const signature = signPayload('test_secret', razorpayOrderId, paymentId);

      await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      const intent = await PaymentIntent.findOne({ razorpayOrderId });
      expect(intent.status).toBe('PAID');

      const again = await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      expect(mocks.orders).toHaveLength(1);
      expect(again._id).toBe(mocks.orders[0]._id);
    });
  });

  describe('processWebhookEvent', () => {
    async function createIntent(service: any, razorpayUtil: any) {
      const create = vi.fn().mockResolvedValue({ id: 'order_rzp_wh_1' });
      vi.mocked(razorpayUtil.getRazorpayClient).mockReturnValue({ orders: { create } } as any);
      await service.createRazorpayOrder(USER_ID, addressFixture(), null);
      return 'order_rzp_wh_1';
    }

    it('reconciles an order.paid event by finalizing the order', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);

      await service.processWebhookEvent({
        event: 'order.paid',
        payload: {
          order: { entity: { id: razorpayOrderId } },
          payment: { entity: { id: 'pay_webhook_1' } },
        },
      });

      expect(mocks.orders).toHaveLength(1);
      expect(mocks.orders[0].paymentStatus).toBe('PAID');
      expect(mocks.products.get('prod1').stock).toBe(8);
    });

    it('does not duplicate finalization when the same webhook event is delivered twice', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);
      const eventPayload = {
        event: 'order.paid',
        payload: {
          order: { entity: { id: razorpayOrderId } },
          payment: { entity: { id: 'pay_webhook_1' } },
        },
      };

      await service.processWebhookEvent(eventPayload);
      await service.processWebhookEvent(eventPayload);

      expect(mocks.orders).toHaveLength(1);
      expect(mocks.products.get('prod1').stock).toBe(8);
    });

    it('does not duplicate work when the webhook arrives after the frontend already verified the payment', async () => {
      const { service, razorpayUtil } = await loadService();
      const razorpayOrderId = await createIntent(service, razorpayUtil);
      const paymentId = 'pay_frontend_1';
      const signature = signPayload('test_secret', razorpayOrderId, paymentId);

      await service.verifyAndFinalizePayment(USER_ID, {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      await service.processWebhookEvent({
        event: 'order.paid',
        payload: {
          order: { entity: { id: razorpayOrderId } },
          payment: { entity: { id: paymentId } },
        },
      });

      expect(mocks.orders).toHaveLength(1);
      expect(mocks.products.get('prod1').stock).toBe(8);
    });
  });
});

function addressFixture() {
  return {
    fullName: 'Jane Doe',
    phone: '9876543210',
    email: 'jane@example.com',
    addressLine: '123 Garden Lane',
    locality: 'Green Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  };
}

function baseLine() {
  return {
    productId: 'prod1',
    slug: 'garden-hose',
    variantSku: null,
    name: 'Garden Hose',
    image: 'hose.jpg',
    variant: null,
    quantity: 2,
    unitPrice: 100,
    mrp: 120,
    totalPrice: 200,
    stock: 10,
    inStock: true,
  };
}
