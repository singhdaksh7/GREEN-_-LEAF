import { describe, it, expect, beforeEach, vi } from 'vitest';

// This file covers createRazorpayOrder's pure business-rule validation
// (empty cart, out-of-stock lines, missing configuration, amount
// calculation) with lightweight mocked models. The finalization path
// (verifyAndFinalizePayment / processWebhookEvent) now runs inside a real
// MongoDB transaction and is covered instead by
// payment.finalize.integration.test.ts against a transaction-capable
// mongodb-memory-server replica set — see that file for why.

const mocks = vi.hoisted(() => {
  const products = new Map<string, any>();

  return {
    products,
    reset() {
      products.clear();
    },
  };
});

vi.mock('../src/models/PaymentIntent', () => ({
  PaymentIntent: {
    create: vi.fn(async (doc: any) => ({ ...doc, _id: 'intent_1' })),
  },
}));

vi.mock('../src/models/Coupon', () => ({
  Coupon: {
    findOne: vi.fn(async () => null),
  },
}));

// payment.service.ts imports Order/Product at module scope even though
// createRazorpayOrder itself never calls them directly (only cartService,
// which is mocked below, touches pricing/stock). Without these mocks, every
// vi.resetModules() + dynamic re-import in this file would re-register the
// real Mongoose models on the shared mongoose singleton and throw
// "Cannot overwrite model once compiled" on the second test.
vi.mock('../src/models/Order', () => ({
  Order: { create: vi.fn(), findById: vi.fn() },
}));

vi.mock('../src/models/Product', () => ({
  Product: { findOneAndUpdate: vi.fn() },
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

async function loadService() {
  vi.resetModules();
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  const razorpayUtil = await import('../src/utils/razorpay');
  const service = await import('../src/services/payment.service');
  return { service, razorpayUtil };
}

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

describe('payment.service.createRazorpayOrder', () => {
  beforeEach(() => {
    mocks.reset();
    mocks.products.set('prod1', { _id: 'prod1', name: 'Garden Hose', stock: 10, variants: [] });
  });

  it('throws when Razorpay is not configured', async () => {
    const { service, razorpayUtil } = await loadService();
    vi.mocked(razorpayUtil.getRazorpayClient).mockImplementation(() => {
      throw new Error('Razorpay is not configured on this server');
    });

    await expect(service.createRazorpayOrder(USER_ID, addressFixture(), null)).rejects.toThrow(/not configured/i);
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
