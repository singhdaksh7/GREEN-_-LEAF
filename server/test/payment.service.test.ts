import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';

// This file covers createRazorpayOrder's pure business-rule validation
// (empty cart, out-of-stock lines, missing configuration, amount
// calculation). It runs against the real MySQL test database (via
// cart/coupon repositories and Prisma directly, exactly like production)
// rather than mocking the persistence layer — only the outbound Razorpay
// SDK call is mocked, since we never want a test run to hit the real
// Razorpay API. The finalization path (verifyAndFinalizePayment /
// processWebhookEvent) is covered separately in
// test/integration/payment.finalize.test.ts.

vi.mock('../src/utils/razorpay', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/razorpay')>('../src/utils/razorpay');
  return {
    ...actual,
    getRazorpayClient: vi.fn(),
    isRazorpayConfigured: vi.fn(() => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)),
  };
});

import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/testDb';
import { createUser, createCategory, createProduct } from './helpers/factories';
import { prisma } from '../src/config/db';
import * as cartRepository from '../src/repositories/cart.repository';
import * as paymentRepository from '../src/repositories/payment.repository';
import * as razorpayUtil from '../src/utils/razorpay';

beforeAll(async () => {
  await setupTestDb();
}, 120000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
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

async function seedCartWithOneItem(userId: string, overrides: { stock?: number; salePrice?: number } = {}) {
  const category = await createCategory();
  const product = await createProduct(category.id, {
    name: 'Garden Hose',
    salePrice: overrides.salePrice ?? 100,
    mrp: 120,
    stock: 10,
  });
  await cartRepository.addItemToCart(userId, product.id, null, 2);

  // Applied after adding to the cart (which itself checks stock) to
  // simulate a race where stock is depleted by someone else between
  // add-to-cart and checkout.
  if (overrides.stock !== undefined) {
    await prisma.product.update({ where: { id: product.id }, data: { stock: overrides.stock } });
  }
  return product;
}

describe('payment.repository.createRazorpayOrder', () => {
  beforeEach(() => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  it('throws when Razorpay is not configured', async () => {
    const user = await createUser();
    await seedCartWithOneItem(user.id);

    await expect(paymentRepository.createRazorpayOrder(user.id, addressFixture(), null)).rejects.toMatchObject({
      statusCode: 503,
      message: 'Online payments are not available yet',
    });
  });

  it('rejects when the cart is empty', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    const user = await createUser();

    await expect(paymentRepository.createRazorpayOrder(user.id, addressFixture(), null)).rejects.toThrow(/cart is empty/i);
  });

  it('rejects when a cart line is out of stock', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    const user = await createUser();
    await seedCartWithOneItem(user.id, { stock: 1 });

    await expect(paymentRepository.createRazorpayOrder(user.id, addressFixture(), null)).rejects.toThrow(/insufficient stock/i);
  });

  it('creates a Razorpay order for the server-calculated amount, converted to paise', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    const user = await createUser();
    await seedCartWithOneItem(user.id);

    const create = vi.fn().mockResolvedValue({ id: 'order_rzp_1' });
    vi.mocked(razorpayUtil.getRazorpayClient).mockReturnValue({ orders: { create } } as never);

    const result = await paymentRepository.createRazorpayOrder(user.id, addressFixture(), null);

    // subtotal 200 (2 x 100) + shipping 79 = 279 rupees => 27900 paise
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ amount: 27900, currency: 'INR' }));
    expect(result).toEqual(expect.objectContaining({ orderId: 'order_rzp_1', amount: 27900, currency: 'INR' }));
  });
});
