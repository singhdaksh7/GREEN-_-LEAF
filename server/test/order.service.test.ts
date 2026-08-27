import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const products = new Map<string, any>();
  const coupons = new Map<string, any>();
  const orders: any[] = [];

  return {
    products,
    coupons,
    orders,
    reset() {
      products.clear();
      coupons.clear();
      orders.length = 0;
    },
  };
});

vi.mock('../src/models/Order', () => ({
  Order: {
    create: vi.fn(async (doc: any) => {
      const record = { ...doc, _id: `order_${mocks.orders.length + 1}` };
      mocks.orders.push(record);
      return record;
    }),
  },
}));

vi.mock('../src/models/Product', () => ({
  Product: {
    findOneAndUpdate: vi.fn(async (filter: any) => {
      const product = mocks.products.get(String(filter._id));
      if (!product) return null;
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

async function loadService() {
  vi.resetModules();
  const service = await import('../src/services/order.service');
  return { service };
}

const USER_ID = 'user_1';

describe('order.service COD regression', () => {
  beforeEach(() => {
    mocks.reset();
    mocks.products.set('prod1', { _id: 'prod1', name: 'Garden Hose', stock: 10, variants: [] });
  });

  it('still places a COD order immediately, marking payment status COD', async () => {
    const { service } = await loadService();

    const order = await service.createOrder(USER_ID, addressFixture(), 'COD', null);

    expect(order.paymentMethod).toBe('COD');
    expect(order.paymentStatus).toBe('COD');
    expect(order.orderStatus).toBe('PENDING');
    expect(mocks.orders).toHaveLength(1);
  });

  it('decrements stock exactly once for a COD order', async () => {
    const { service } = await loadService();
    await service.createOrder(USER_ID, addressFixture(), 'COD', null);
    expect(mocks.products.get('prod1').stock).toBe(8);
  });

  it('increments coupon usage exactly once for a COD order with a coupon', async () => {
    mocks.coupons.set('SAVE20', {
      code: 'SAVE20',
      type: 'FLAT',
      value: 20,
      minOrderValue: 0,
      maxDiscount: null,
      expiresAt: null,
      usageLimit: null,
      usedCount: 0,
      isActive: true,
      save: vi.fn(async function (this: any) {}),
    });

    const { service } = await loadService();
    const order = await service.createOrder(USER_ID, addressFixture(), 'COD', 'SAVE20');

    expect(order.discount).toBe(20);
    expect(mocks.coupons.get('SAVE20').usedCount).toBe(1);
  });

  it('rejects a COD order when the cart is empty', async () => {
    const { service } = await loadService();
    const cartService = await import('../src/services/cart.service');
    vi.mocked(cartService.getOrCreateCart).mockResolvedValueOnce({ items: [] } as any);

    await expect(service.createOrder(USER_ID, addressFixture(), 'COD', null)).rejects.toThrow(/cart is empty/i);
  });
});
