import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import crypto from 'node:crypto';

// finalizePaymentIntent now runs its stock/coupon/order mutations inside a
// real MongoDB transaction, which a standalone mongod cannot provide (the
// project's local docker-compose Mongo is standalone). Rather than weaken
// production behavior to fit a non-transactional test double, this suite
// boots a genuine transaction-capable single-node replica set in memory via
// mongodb-memory-server, and exercises payment.service against real
// Mongoose models. Nothing here talks to Atlas or any production database.

const RAZORPAY_KEY_SECRET = 'test_secret_key';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = RAZORPAY_KEY_SECRET;

vi.mock('../src/utils/razorpay', async () => {
  const actual = await vi.importActual<typeof import('../src/utils/razorpay')>('../src/utils/razorpay');
  return { ...actual, getRazorpayClient: vi.fn() };
});

let replset: MongoMemoryReplSet;
let paymentService: typeof import('../src/services/payment.service');
let PaymentIntent: typeof import('../src/models/PaymentIntent').PaymentIntent;
let Order: typeof import('../src/models/Order').Order;
let Product: typeof import('../src/models/Product').Product;
let Coupon: typeof import('../src/models/Coupon').Coupon;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replset.getUri(), { dbName: 'razorpay-finalize-test' });

  paymentService = await import('../src/services/payment.service');
  ({ PaymentIntent } = await import('../src/models/PaymentIntent'));
  ({ Order } = await import('../src/models/Order'));
  ({ Product } = await import('../src/models/Product'));
  ({ Coupon } = await import('../src/models/Coupon'));
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await replset.stop();
});

beforeEach(async () => {
  await Promise.all([
    PaymentIntent.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
  ]);
  vi.restoreAllMocks();
});

function sign(orderId: string, paymentId: string): string {
  return crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
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

async function createProduct(stock: number, name = 'Garden Hose') {
  return Product.create({
    name,
    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${new Types.ObjectId().toString()}`,
    shortDescription: 'A hose',
    description: 'A garden hose',
    sku: `SKU-${new Types.ObjectId().toString()}`,
    brand: 'GreenKart',
    category: new Types.ObjectId(),
    images: ['hose.jpg'],
    variants: [],
    mrp: 120,
    salePrice: 100,
    stock,
  });
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

describe('payment finalization atomicity (real MongoDB transaction)', () => {
  it('rolls back an earlier successful stock decrement when a later line in the same order is unavailable', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10, 'Garden Hose');
    const p2 = await createProduct(1, 'Pruning Shears'); // only 1 in stock, order wants 2

    const razorpayOrderId = 'order_multi_fail';
    await createIntent({
      userId,
      razorpayOrderId,
      lines: [lineFor(p1, 2), lineFor(p2, 2)],
    });
    const paymentId = 'pay_multi_fail';

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

    const intent = await PaymentIntent.findOne({ razorpayOrderId });
    expect(intent!.status).toBe('REQUIRES_REFUND');
    expect(intent!.failureReason).toMatch(/insufficient stock/i);
  });

  it('rolls back stock if the coupon reservation fails (usage limit already consumed)', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10);
    await Coupon.create({ code: 'MAXED', type: 'FLAT', value: 10, usageLimit: 1, usedCount: 1, isActive: true });

    const razorpayOrderId = 'order_coupon_fail';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'MAXED' });
    const paymentId = 'pay_coupon_fail';

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
    const p1 = await createProduct(10);
    await Coupon.create({ code: 'SAVE10', type: 'FLAT', value: 10, usageLimit: null, usedCount: 0, isActive: true });

    const razorpayOrderId = 'order_create_fail';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'SAVE10' });
    const paymentId = 'pay_create_fail';

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

  it('commits stock decrement, coupon increment, and order creation atomically on success', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10);
    await Coupon.create({ code: 'SAVE10', type: 'FLAT', value: 10, usageLimit: 5, usedCount: 0, isActive: true });

    const razorpayOrderId = 'order_success';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)], couponCode: 'SAVE10' });
    const paymentId = 'pay_success';

    const order = await paymentService.verifyAndFinalizePayment(userId.toString(), {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    });

    expect(order.paymentStatus).toBe('PAID');
    expect(order.paymentMethod).toBe('ONLINE');
    expect(order.user.toString()).toBe(userId.toString());
    expect((await Product.findById(p1._id))!.stock).toBe(8);
    expect((await Coupon.findOne({ code: 'SAVE10' }))!.usedCount).toBe(1);
    expect(await Order.countDocuments({})).toBe(1);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PAID');
  });

  it('does not mutate anything again on a duplicate verify call for the same payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10);
    const razorpayOrderId = 'order_dup_verify';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_dup_verify';
    const body = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(razorpayOrderId, paymentId),
    };

    const first = await paymentService.verifyAndFinalizePayment(userId.toString(), body);
    const second = await paymentService.verifyAndFinalizePayment(userId.toString(), body);

    expect(second._id.toString()).toBe(first._id.toString());
    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
  });

  it('creates exactly one order when verify and a racing webhook both target the same payment', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10);
    const razorpayOrderId = 'order_race';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_race';

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
        payment: { entity: { id: paymentId } },
      },
    });

    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
  });

  it('creates exactly one order when the same webhook event is delivered twice', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(10);
    const razorpayOrderId = 'order_dup_webhook';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_dup_webhook';
    const eventPayload = {
      event: 'order.paid',
      payload: {
        order: { entity: { id: razorpayOrderId } },
        payment: { entity: { id: paymentId } },
      },
    };

    await paymentService.processWebhookEvent(eventPayload);
    await paymentService.processWebhookEvent(eventPayload);

    expect(await Order.countDocuments({})).toBe(1);
    expect((await Product.findById(p1._id))!.stock).toBe(8);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('PAID');
  });

  it('flags a captured payment as REQUIRES_REFUND (not FAILED) when stock is unavailable at fulfillment time', async () => {
    const userId = new Types.ObjectId();
    const p1 = await createProduct(1); // only 1 available, order wants 2
    const razorpayOrderId = 'order_oos';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });
    const paymentId = 'pay_oos';

    await expect(
      paymentService.verifyAndFinalizePayment(userId.toString(), {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sign(razorpayOrderId, paymentId),
      })
    ).rejects.toThrow();

    const intent = await PaymentIntent.findOne({ razorpayOrderId });
    expect(intent!.status).toBe('REQUIRES_REFUND');
    expect(intent!.status).not.toBe('FAILED');

    // A REQUIRES_REFUND intent must not be silently reprocessed by a retry.
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
    const p1 = await createProduct(10);

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
    const p1 = await createProduct(10);
    const razorpayOrderId = 'order_unknown_event';
    await createIntent({ userId, razorpayOrderId, lines: [lineFor(p1, 2)] });

    await expect(
      paymentService.processWebhookEvent({ event: 'refund.processed', payload: {} } as any)
    ).resolves.toBeUndefined();

    expect(await Order.countDocuments({})).toBe(0);
    expect((await PaymentIntent.findOne({ razorpayOrderId }))!.status).toBe('CREATED');
  });
});
