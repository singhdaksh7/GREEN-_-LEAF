import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Types } from 'mongoose';
import crypto from 'node:crypto';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';

// finalizePaymentIntent runs its stock/coupon/order mutations inside a real
// MongoDB transaction, so this suite uses the same transaction-capable
// in-memory replica set (setupTestDb) as the rest of the integration suite —
// nothing here talks to Atlas or any production database. The Razorpay API
// itself is always mocked (getRazorpayClient) — no real payment requests
// are ever made.
//
// Deliberately NOT statically importing ../helpers/factories (or the model
// files) here: factories.ts pulls in utils/jwt.ts, which imports
// config/env.ts, and that module's `env` object is evaluated once and
// cached for this file's whole run. If that happened before the
// process.env assignment below, env.razorpayKeySecret would be frozen at
// '' for every test in this file. Everything that could trigger that chain
// is imported dynamically inside beforeAll instead, after these are set.

const RAZORPAY_KEY_SECRET = 'test_secret_key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = RAZORPAY_KEY_SECRET;

vi.mock('../../src/utils/razorpay', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/razorpay')>('../../src/utils/razorpay');
  return { ...actual, getRazorpayClient: vi.fn() };
});

let paymentService: typeof import('../../src/services/payment.service');
let razorpayUtil: typeof import('../../src/utils/razorpay');
let PaymentIntent: typeof import('../../src/models/PaymentIntent').PaymentIntent;
let Order: typeof import('../../src/models/Order').Order;
let Product: typeof import('../../src/models/Product').Product;
let Coupon: typeof import('../../src/models/Coupon').Coupon;
let createCategory: typeof import('../helpers/factories').createCategory;
let createProductFactory: typeof import('../helpers/factories').createProduct;
let createCoupon: typeof import('../helpers/factories').createCoupon;

beforeAll(async () => {
  await setupTestDb();
  paymentService = await import('../../src/services/payment.service');
  razorpayUtil = await import('../../src/utils/razorpay');
  ({ PaymentIntent } = await import('../../src/models/PaymentIntent'));
  ({ Order } = await import('../../src/models/Order'));
  ({ Product } = await import('../../src/models/Product'));
  ({ Coupon } = await import('../../src/models/Coupon'));
  ({ createCategory, createProduct: createProductFactory, createCoupon } = await import('../helpers/factories'));
}, 120_000);

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  vi.restoreAllMocks();
});

function sign(orderId: string, paymentId: string): string {
  return crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}

/** Mocks the Razorpay API's payments.fetch response for the next call(s). */
function mockRazorpayPaymentStatus(opts: { id: string; order_id: string; amount: number; currency?: string; status?: string }) {
  vi.mocked(razorpayUtil.getRazorpayClient).mockReturnValue({
    payments: {
      fetch: vi.fn().mockResolvedValue({
        id: opts.id,
        order_id: opts.order_id,
        amount: opts.amount,
        currency: opts.currency ?? 'INR',
        status: opts.status ?? 'captured',
      }),
    },
  } as any);
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

/** Thin wrapper around the shared factory: stock/name are what these tests vary most. */
async function createStockedProduct(stock: number, name = 'Garden Hose') {
  // createCategory() defaults to a fixed slug ('planters'); this suite calls
  // it multiple times per test (and across tests), so give each call a
  // unique slug to avoid a duplicate-key collision.
  const category = await createCategory({ slug: `cat-${Date.now()}-${Math.random().toString(36).slice(2)}` });
  return createProductFactory(category.id, { name, stock, mrp: 120, salePrice: 100 });
}

function lineFor(product: { _id: Types.ObjectId; name: string }, quantity: number, unitPrice = 100) {
  return {
    productId: product._id,
    variantSku: null,
    name: product.name,
    image: 'hose.jpg',
    variant: null,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
  };
}

async function createIntent(opts: {
  userId: Types.ObjectId;
  lines: ReturnType<typeof lineFor>[];
  razorpayOrderId: string;
  couponCode?: string | null;
}) {
  const subtotal = opts.lines.reduce((sum, l) => sum + l.totalPrice, 0);
  return PaymentIntent.create({
    user: opts.userId,
    razorpayOrderId: opts.razorpayOrderId,
    amount: subtotal * 100,
    currency: 'INR',
    status: 'CREATED',
    shippingAddress: addressFixture(),
    couponCode: opts.couponCode ?? null,
    lines: opts.lines,
    subtotal,
    discount: 0,
    shipping: 0,
    tax: 0,
    grandTotal: subtotal,
  });
}

function expectConfirmed(result: Awaited<ReturnType<typeof paymentService.verifyAndFinalizePayment>>) {
  if (result.status !== 'CONFIRMED') throw new Error(`Expected CONFIRMED, got ${result.status}`);
  return result.order;
}

describe('payment finalization atomicity (real MongoDB transaction)', () => {
  it('rolls back an earlier successful stock decrement when a later line in the same order is unavailable', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10, 'Garden Hose');
    const p2 = await createStockedProduct(1, 'Pruning Shears'); // only 1 in stock, order wants 2

    const razorpayOrderId = 'order_multi_fail';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2), lineFor(p2, 2)] });
    const paymentId = 'pay_multi_fail';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow(/could not complete your order/i);

    expect((await Product.findById(p1._id))!.stock).toBe(10); // rolled back, not left at 8
    expect((await Product.findById(p2._id))!.stock).toBe(1);
    expect(await Order.countDocuments({})).toBe(0);

    const after = await PaymentIntent.findOne({ razorpayOrderId });
    expect(after!.status).toBe('REQUIRES_REFUND');
    expect(after!.failureReason).toMatch(/insufficient stock/i);
  });

  it('rolls back stock if the coupon reservation fails (usage limit already consumed)', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    await createCoupon({ code: 'MAXED', type: 'FLAT', value: 10, usageLimit: 1, usedCount: 1, isActive: true });

    const razorpayOrderId = 'order_coupon_fail';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'MAXED' });
    const paymentId = 'pay_coupon_fail';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow();

    expect((await Product.findById(p1._id))!.stock).toBe(10);
    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('REQUIRES_REFUND');
  });

  it('rolls back stock and coupon reservation if Order creation itself fails', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    await createCoupon({ code: 'SAVE10', type: 'FLAT', value: 10, usageLimit: null, usedCount: 0, isActive: true });

    const razorpayOrderId = 'order_create_fail';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'SAVE10' });
    const paymentId = 'pay_create_fail';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    const createSpy = vi.spyOn(Order, 'create').mockRejectedValueOnce(new Error('simulated order create failure'));

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow();

    createSpy.mockRestore();

    expect((await Product.findById(p1._id))!.stock).toBe(10);
    expect((await Coupon.findOne({ code: 'SAVE10' }))!.usedCount).toBe(0);
    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('REQUIRES_REFUND');
  });

  it('commits stock decrement, coupon increment, and order creation atomically on a captured payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    await createCoupon({ code: 'SAVE10', type: 'FLAT', value: 10, usageLimit: 5, usedCount: 0, isActive: true });

    const razorpayOrderId = 'order_success';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'SAVE10' });
    const paymentId = 'pay_success';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    const result = await paymentService.verifyAndFinalizePayment(userId.toString(), {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    });
    const order = expectConfirmed(result);

    expect(order.paymentStatus).toBe('PAID');
    expect(order.paymentMethod).toBe('ONLINE');
    expect(order.user.toString()).toBe(userId.toString());
    expect((await Product.findById(p1._id))!.stock).toBe(8);
    expect((await Coupon.findOne({ code: 'SAVE10' }))!.usedCount).toBe(1);
    expect(await Order.countDocuments({})).toBe(1);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PAID');
  });

  it('does NOT finalize when the payment is only authorized, not yet captured', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_authorized_only';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_authorized_only';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount, status: 'authorized' });

    const result = await paymentService.verifyAndFinalizePayment(userId.toString(), {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    });

    expect(result.status).toBe('PENDING');
    expect(await Order.countDocuments({})).toBe(0);
    expect((await Product.findById(p1._id))!.stock).toBe(10);
    // No claim was ever made — the intent is untouched, free for the
    // eventual payment.captured/order.paid webhook to finalize.
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });

  it('rejects when the Razorpay-reported order ID does not match the PaymentIntent', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_mismatch_orderid';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_mismatch_orderid';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: 'order_someone_else', amount: intent.amount });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow(/order ID mismatch/i);

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });

  it('rejects when the Razorpay-reported amount does not match the PaymentIntent', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_mismatch_amount';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_mismatch_amount';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount - 1 });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow(/amount mismatch/i);

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });

  it('rejects when the Razorpay-reported currency is not INR', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_mismatch_currency';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_mismatch_currency';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount, currency: 'USD' });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow(/currency mismatch/i);

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });

  it('does not mutate anything again on a duplicate verify call for the same payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_dup_verify';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_dup_verify';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });
    const body = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    };

    const first = expectConfirmed(await paymentService.verifyAndFinalizePayment(userId.toString(), body));
    const second = expectConfirmed(await paymentService.verifyAndFinalizePayment(userId.toString(), body));

    expect(second._id.toString()).toBe(first._id.toString());
    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
  });

  it('creates exactly one order when the browser never verifies and a payment.captured webhook arrives instead', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_webhook_only';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_webhook_only';

    await paymentService.processWebhookEvent({
      event: 'payment.captured',
      payload: {
        order: { entity: { id: razorpayOrderId } },
        payment: { entity: { id: paymentId, order_id: razorpayOrderId, amount: intent.amount, currency: 'INR', status: 'captured' } },
      },
    });

    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PAID');
  });

  it('creates exactly one order when payment.captured and order.paid both fire for the same payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_both_events';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_both_events';
    const paymentEntity = { id: paymentId, order_id: razorpayOrderId, amount: intent.amount, currency: 'INR', status: 'captured' };

    await paymentService.processWebhookEvent({
      event: 'payment.captured',
      payload: { order: { entity: { id: razorpayOrderId } }, payment: { entity: paymentEntity } },
    });
    await paymentService.processWebhookEvent({
      event: 'order.paid',
      payload: { order: { entity: { id: razorpayOrderId } }, payment: { entity: paymentEntity } },
    });

    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
  });

  it('creates exactly one order when verify and a racing webhook both target the same payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_race';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_race';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    await paymentService.verifyAndFinalizePayment(userId.toString(), {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    });

    // The webhook arrives after the frontend already finalized the payment.
    await paymentService.processWebhookEvent({
      event: 'order.paid',
      payload: {
        order: { entity: { id: razorpayOrderId } },
        payment: { entity: { id: paymentId, order_id: razorpayOrderId, amount: intent.amount, currency: 'INR', status: 'captured' } },
      },
    });

    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
  });

  it('flags a captured payment as REQUIRES_REFUND (not FAILED) when stock is unavailable at fulfillment time', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(1); // only 1 available, order wants 2
    const razorpayOrderId = 'order_oos';
    const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_oos';
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow();

    const after = await PaymentIntent.findOne({ razorpayOrderId });
    expect(after!.status).toBe('REQUIRES_REFUND');
    expect(after!.status).not.toBe('FAILED');

    // A REQUIRES_REFUND intent must not be silently reprocessed by a retry.
    mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });
    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow(/manual reconciliation/i);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('rejects a client-supplied order ID substituted for a different real payment (signature is bound to the server-known order ID)', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);

    const expensiveOrderId = 'order_expensive';
    const cheapOrderId = 'order_cheap';
    await createIntent({ userId, razorpayOrderId: expensiveOrderId, lines: [lineFor(p1, 1, 5000)] });
    await createIntent({ userId, razorpayOrderId: cheapOrderId, lines: [lineFor(p1, 1, 10)] });

    // Attacker genuinely paid for the cheap order and holds a valid
    // signature for (cheapOrderId, paymentId) — but tries to apply it to
    // the expensive order by claiming razorpay_order_id = expensiveOrderId.
    const paymentId = 'pay_shared';
    const signatureForCheapOrder = sign(cheapOrderId, paymentId);

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: expensiveOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureForCheapOrder,
      })
    ).rejects.toThrow(/verification failed/i);

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId: expensiveOrderId }))!.status).toBe('CREATED');
    expect((await Product.findById(p1._id))!.stock).toBe(10);
  });

  it('ignores an unknown webhook event type safely', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createStockedProduct(10);
    const razorpayOrderId = 'order_unknown_event';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });

    await expect(
      paymentService.processWebhookEvent({ event: 'refund.processed', payload: {} } as any)
    ).resolves.toBeUndefined();

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });

  describe('PROCESSING crash recovery and fencing', () => {
    it('safely recovers a stale PROCESSING intent (crashed worker) and finalizes exactly once', async () => {
      const userId = new Types.ObjectId();
      const p1 = await createStockedProduct(10);
      const razorpayOrderId = 'order_stale_recover';
      const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
      const paymentId = 'pay_stale_recover';

      // Simulate a worker that claimed the intent and then crashed before
      // its transaction ever ran: PROCESSING, with a processingStartedAt
      // well past the staleness threshold.
      const staleTimestamp = new Date(Date.now() - 6 * 60 * 1000);
      await PaymentIntent.updateOne(
        { _id: intent._id },
        { $set: { status: 'PROCESSING', processingStartedAt: staleTimestamp, razorpayPaymentId: paymentId } }
      );

      mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

      const result = await paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      });
      const order = expectConfirmed(result);

      expect(order.paymentStatus).toBe('PAID');
      expect(await Order.countDocuments({})).toBe(1);
      expect((await Product.findById(p1._id))!.stock).toBe(8); // decremented exactly once
      expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PAID');
    });

    it('does not let a fresh (non-stale) PROCESSING intent be reclaimed or reprocessed', async () => {
      const userId = new Types.ObjectId();
      const p1 = await createStockedProduct(10);
      const razorpayOrderId = 'order_fresh_processing';
      const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
      const paymentId = 'pay_fresh_processing';

      // A healthy worker claimed this moments ago and is (for the purposes
      // of this test) still "mid-transaction".
      await PaymentIntent.updateOne(
        { _id: intent._id },
        { $set: { status: 'PROCESSING', processingStartedAt: new Date(), razorpayPaymentId: paymentId } }
      );

      mockRazorpayPaymentStatus({ id: paymentId, order_id: razorpayOrderId, amount: intent.amount });

      await expect(
        paymentService.verifyAndFinalizePayment(userId.toString(), {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: sign(razorpayOrderId, paymentId),
        })
      ).rejects.toThrow(/already being processed/i);

      expect(await Order.countDocuments({})).toBe(0);
      expect((await Product.findById(p1._id))!.stock).toBe(10);
      expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PROCESSING');
    });

    it('a stale-fenced fulfilment-failure write cannot clobber a PaymentIntent another worker already finalized to PAID', async () => {
      // Regression test for the "zombie worker resumes after being
      // reclaimed" race: a worker that claimed the intent long ago (and is
      // now presumed crashed) must never be able to overwrite the outcome
      // of whichever worker actually reclaimed and finalized it, even if it
      // wakes up afterward and tries to record its own (stale) failure.
      const userId = new Types.ObjectId();
      const p1 = await createStockedProduct(10);
      const razorpayOrderId = 'order_zombie_fenced';
      const intent = await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });

      const zombieClaimToken = new Date(Date.now() - 10 * 60 * 1000);
      await PaymentIntent.updateOne(
        { _id: intent._id },
        { $set: { status: 'PROCESSING', processingStartedAt: zombieClaimToken, razorpayPaymentId: 'pay_zombie' } }
      );

      // Meanwhile, a legitimate reclaim + successful finalize happens with a
      // fresh token.
      const winningOrder = await Order.create({
        orderNumber: 'GLZOMBIETEST',
        user: userId,
        items: [
          {
            product: p1._id,
            productName: p1.name,
            productImage: 'hose.jpg',
            sku: p1.sku,
            variant: null,
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
        ],
        shippingAddress: addressFixture(),
        subtotal: 200,
        discount: 0,
        shipping: 0,
        tax: 0,
        grandTotal: 200,
        couponCode: null,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        razorpayOrderId,
        razorpayPaymentId: 'pay_winner',
        orderStatus: 'CONFIRMED',
        statusHistory: [{ status: 'CONFIRMED', changedAt: new Date() }],
      });
      await PaymentIntent.updateOne(
        { _id: intent._id },
        { $set: { status: 'PAID', order: winningOrder._id, processingStartedAt: new Date() } }
      );

      // The "zombie" now attempts its own fenced failure-path write, using
      // the exact same filter shape finalizePaymentIntent's catch block
      // uses: _id + its own (stale) processingStartedAt + status PROCESSING.
      const zombieWrite = await PaymentIntent.updateOne(
        { _id: intent._id, processingStartedAt: zombieClaimToken, status: 'PROCESSING' },
        { $set: { status: 'REQUIRES_REFUND', failureReason: 'zombie: insufficient stock' } }
      );

      expect(zombieWrite.matchedCount).toBe(0); // the stale write must not apply

      const after = await PaymentIntent.findOne({ razorpayOrderId });
      expect(after!.status).toBe('PAID'); // untouched by the zombie
      expect(after!.order?.toString()).toBe(winningOrder._id.toString());
    });
  });
});
