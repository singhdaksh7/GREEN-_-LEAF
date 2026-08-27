import mongoose from 'mongoose';
import { Order, IOrder } from '../models/Order';
import { PaymentIntent, IPaymentIntent } from '../models/PaymentIntent';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { getRazorpayClient, toPaise, timingSafeEqualHex, computeHmacSha256Hex } from '../utils/razorpay';
import * as cartService from './cart.service';
import { applyCoupon, validateCouponEligibility } from './pricing.service';
import { ShippingAddressInput } from './order.service';

export interface RazorpayOrderInitData {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GL${timestamp}${random}`;
}

export async function createRazorpayOrder(
  userId: string,
  shippingAddress: ShippingAddressInput,
  couponCode: string | null
): Promise<RazorpayOrderInitData> {
  const cart = await cartService.getOrCreateCart(userId);
  if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const priced = await cartService.priceCart(cart);

  const outOfStock = priced.lines.filter((line) => !line.inStock);
  if (outOfStock.length > 0) {
    throw ApiError.badRequest(`Insufficient stock for: ${outOfStock.map((l) => l.name).join(', ')}`);
  }

  let discount = 0;
  let freeShipping = false;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw ApiError.badRequest('Invalid coupon code');
    validateCouponEligibility(coupon, priced.subtotal);
    const applied = applyCoupon(priced.subtotal, coupon);
    discount = applied.discount;
    freeShipping = applied.freeShipping;
  }

  const shipping = freeShipping ? 0 : priced.shipping;
  const tax = 0;
  const grandTotal = Math.max(0, priced.subtotal - discount + shipping + tax);

  if (grandTotal <= 0) {
    throw ApiError.badRequest('Order amount must be greater than zero for online payment');
  }

  const amountPaise = toPaise(grandTotal);
  const client = getRazorpayClient();

  const razorpayOrder = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}_${userId.slice(-6)}`,
    notes: { userId },
  });

  await PaymentIntent.create({
    user: userId,
    razorpayOrderId: razorpayOrder.id,
    amount: amountPaise,
    currency: 'INR',
    status: 'CREATED',
    shippingAddress,
    couponCode: coupon?.code ?? null,
    lines: priced.lines.map((line) => ({
      productId: line.productId,
      variantSku: line.variantSku,
      name: line.name,
      image: line.image,
      variant: line.variant,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
    })),
    subtotal: priced.subtotal,
    discount,
    shipping,
    tax,
    grandTotal,
    order: null,
  });

  return {
    keyId: env.razorpayKeyId,
    orderId: razorpayOrder.id,
    amount: amountPaise,
    currency: 'INR',
    name: 'GreenKart',
  };
}

async function finalizePaymentIntent(intent: IPaymentIntent, razorpayPaymentId: string): Promise<IOrder> {
  if (intent.status === 'PAID' && intent.order) {
    const existing = await Order.findById(intent.order);
    if (existing) return existing;
  }

  if (intent.status === 'FAILED') {
    throw ApiError.badRequest('This payment has already failed and cannot be finalized');
  }

  if (intent.status === 'REQUIRES_REFUND') {
    throw ApiError.conflict(
      'This payment was captured but GreenKart fulfillment previously failed. It requires manual reconciliation and cannot be re-finalized automatically.'
    );
  }

  // Atomic single-winner claim: only the first caller to see status CREATED
  // transitions it to PROCESSING. This guards double-click, duplicate
  // verification requests, and a webhook racing the frontend callback. It
  // deliberately runs outside the transaction below: single-document writes
  // are already atomic, and keeping the lock separate avoids write-conflict
  // retries between the two callers racing for it.
  const claimed = await PaymentIntent.findOneAndUpdate(
    { _id: intent._id, status: 'CREATED' },
    { $set: { status: 'PROCESSING', razorpayPaymentId } },
    { new: true }
  );

  if (!claimed) {
    const current = await PaymentIntent.findById(intent._id);
    if (current?.status === 'PAID' && current.order) {
      const existing = await Order.findById(current.order);
      if (existing) return existing;
    }
    if (current?.status === 'PROCESSING') {
      throw ApiError.conflict('This payment is already being processed');
    }
    throw ApiError.badRequest('This payment could not be finalized');
  }

  // From this point on, Razorpay has captured the payment and we hold the
  // sole claim on it. Stock decrement, coupon reservation, Order creation,
  // and the intent's own PAID transition all happen in one MongoDB
  // transaction so they commit or roll back together — no partial stock
  // decrement can survive a later coupon or order-creation failure. The
  // external Razorpay API call has already completed by this point and is
  // intentionally never inside this transaction.
  const session = await mongoose.startSession();
  try {
    const order = await session.withTransaction(async () => {
      for (const line of claimed.lines) {
        if (line.variantSku) {
          const product = await Product.findOneAndUpdate(
            { _id: line.productId, variants: { $elemMatch: { sku: line.variantSku, stock: { $gte: line.quantity } } } },
            { $inc: { 'variants.$.stock': -line.quantity } },
            { session }
          );
          if (!product) throw ApiError.badRequest(`Insufficient stock for ${line.name}`);
        } else {
          const product = await Product.findOneAndUpdate(
            { _id: line.productId, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity } },
            { session }
          );
          if (!product) throw ApiError.badRequest(`Insufficient stock for ${line.name}`);
        }
      }

      if (claimed.couponCode) {
        const reserved = await Coupon.findOneAndUpdate(
          {
            code: claimed.couponCode,
            isActive: true,
            $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
          },
          { $inc: { usedCount: 1 } },
          { session }
        );
        if (!reserved) throw ApiError.badRequest('This coupon has just reached its usage limit');
      }

      const [created] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            user: claimed.user,
            items: claimed.lines.map((line) => ({
              product: line.productId,
              productName: line.name,
              productImage: line.image,
              sku: line.variantSku ?? line.name,
              variant: line.variant,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalPrice: line.totalPrice,
            })),
            shippingAddress: claimed.shippingAddress,
            subtotal: claimed.subtotal,
            discount: claimed.discount,
            shipping: claimed.shipping,
            tax: claimed.tax,
            grandTotal: claimed.grandTotal,
            couponCode: claimed.couponCode,
            paymentMethod: 'ONLINE',
            paymentStatus: 'PAID',
            razorpayOrderId: claimed.razorpayOrderId,
            razorpayPaymentId,
            orderStatus: 'CONFIRMED',
            statusHistory: [
              { status: 'PENDING', changedAt: claimed.createdAt },
              { status: 'CONFIRMED', changedAt: new Date() },
            ],
          },
        ],
        { session }
      );

      await PaymentIntent.updateOne(
        { _id: claimed._id },
        { $set: { status: 'PAID', order: created._id } },
        { session }
      );

      return created;
    });

    // Clearing the cart is a convenience, not a financial invariant: the
    // order has already committed above, so a failure here must never be
    // treated as a fulfillment failure.
    try {
      await cartService.clearCart(claimed.user.toString());
    } catch (clearCartErr) {
      console.error('Failed to clear cart after a successful Razorpay order', {
        paymentIntentId: claimed._id,
        error: clearCartErr,
      });
    }

    return order as IOrder;
  } catch (err) {
    // The transaction aborted (business rule, e.g. insufficient stock, or an
    // infrastructure failure) after Razorpay had already captured the
    // payment. Every stock decrement, coupon reservation, and order
    // creation attempted inside the transaction has been rolled back
    // automatically — nothing partial can remain. What must never happen is
    // silently losing track of the money: flag it for manual refund.
    const failureReason = err instanceof Error ? err.message : 'Unknown error';
    await PaymentIntent.updateOne(
      { _id: claimed._id, status: 'PROCESSING' },
      { $set: { status: 'REQUIRES_REFUND', failureReason } }
    );
    console.error('Razorpay payment captured but GreenKart order fulfillment failed — REQUIRES_REFUND', {
      paymentIntentId: claimed._id,
      razorpayOrderId: claimed.razorpayOrderId,
      razorpayPaymentId,
      error: failureReason,
    });
    throw ApiError.internal(
      'Your payment was received but we could not complete your order automatically. Our team has been notified and will contact you.'
    );
  } finally {
    await session.endSession();
  }
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyAndFinalizePayment(userId: string, input: VerifyPaymentInput): Promise<IOrder> {
  if (!env.razorpayKeySecret) throw ApiError.internal('Razorpay is not configured on this server');

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  // Resolve the PaymentIntent from our own database first, and verify the
  // signature against the order ID *stored on that record* rather than the
  // raw client-supplied field. The two happen to be equal by construction of
  // this lookup, but anchoring the HMAC input to server-loaded state (and
  // asserting the match explicitly) means a future refactor that starts
  // deriving the intent some other way — e.g. from a client-supplied intent
  // id instead of the order id — cannot silently start trusting an
  // unbound, arbitrary client order id for the signature calculation.
  const intent = await PaymentIntent.findOne({ razorpayOrderId: razorpay_order_id });
  if (!intent) throw ApiError.notFound('Payment session not found');
  if (intent.user.toString() !== userId) throw ApiError.forbidden('This payment does not belong to you');
  if (intent.razorpayOrderId !== razorpay_order_id) {
    throw ApiError.badRequest('Payment verification failed: order ID mismatch');
  }

  const expected = computeHmacSha256Hex(env.razorpayKeySecret, `${intent.razorpayOrderId}|${razorpay_payment_id}`);
  if (!timingSafeEqualHex(expected, razorpay_signature)) {
    throw ApiError.badRequest('Payment verification failed: invalid signature');
  }

  return finalizePaymentIntent(intent, razorpay_payment_id);
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    order?: { entity?: { id?: string } };
  };
}

export async function processWebhookEvent(payload: RazorpayWebhookPayload): Promise<void> {
  const { event } = payload;

  if (event === 'order.paid' || event === 'payment.captured') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const razorpayOrderId = orderEntity?.id ?? paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    if (!razorpayOrderId || !razorpayPaymentId) return;

    const intent = await PaymentIntent.findOne({ razorpayOrderId });
    if (!intent) return;
    // Already in a terminal state: PAID means this event (or the frontend's
    // own verification) already finalized it; FAILED/REQUIRES_REFUND mean
    // it's flagged for manual handling and must not be silently reprocessed.
    if (intent.status === 'PAID' || intent.status === 'FAILED' || intent.status === 'REQUIRES_REFUND') return;

    await finalizePaymentIntent(intent, razorpayPaymentId);
    return;
  }

  if (event === 'payment.failed') {
    const razorpayOrderId = payload.payload?.payment?.entity?.order_id;
    if (!razorpayOrderId) return;
    await PaymentIntent.updateOne(
      { razorpayOrderId, status: 'CREATED' },
      { $set: { status: 'FAILED', failureReason: 'Razorpay reported payment.failed' } }
    );
  }
}
