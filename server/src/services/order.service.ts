import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, PaymentMethod } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { ApiError } from '../utils/ApiError';
import * as cartService from './cart.service';
import { applyCoupon, validateCouponEligibility } from './pricing.service';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GL${timestamp}${random}`;
}

export async function createOrder(
  userId: string,
  shippingAddress: ShippingAddressInput,
  paymentMethod: PaymentMethod,
  couponCode: string | null
): Promise<IOrder> {
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

  // Stock decrement, coupon usage, order creation, and clearing the cart must
  // all succeed or all roll back together: if we decremented stock and then
  // failed to reserve coupon usage (or vice versa), we'd otherwise be left
  // with stock gone but no order, or an order with a coupon that was never
  // actually reserved. A session/transaction gives us that atomicity instead
  // of hand-rolling compensating writes for every failure path.
  const session = await mongoose.startSession();
  try {
    const order = await session.withTransaction(async () => {
      // Decrement stock atomically per line, conditioned on sufficient stock
      // still being available at write time (protects against concurrent
      // orders both passing the earlier read-only stock check).
      for (const line of priced.lines) {
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

      // Reserve coupon usage atomically: only increment if the coupon is
      // still active and (when limited) still below its usage limit. This
      // is the same check-and-increment race that $inc-without-condition
      // would miss under concurrent checkouts.
      if (coupon) {
        const reserved = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            isActive: true,
            $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
          },
          { $inc: { usedCount: 1 } },
          { session }
        );
        if (!reserved) throw ApiError.badRequest('This coupon has just reached its usage limit. Please remove it and try again.');
      }

      const [created] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            user: userId,
            items: priced.lines.map((line) => ({
              product: line.productId,
              productName: line.name,
              productImage: line.image,
              sku: line.variantSku ?? line.slug,
              variant: line.variant,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalPrice: line.totalPrice,
            })),
            shippingAddress,
            subtotal: priced.subtotal,
            discount,
            shipping,
            tax,
            grandTotal,
            couponCode: coupon?.code ?? null,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'COD' : 'PENDING',
            orderStatus: 'PENDING',
            statusHistory: [{ status: 'PENDING', changedAt: new Date() }],
          },
        ],
        { session }
      );

      await cartService.clearCart(userId, session);

      return created;
    });

    return order as IOrder;
  } finally {
    await session.endSession();
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  order.orderStatus = status;
  order.statusHistory.push({ status, changedAt: new Date(), note });
  if (status === 'DELIVERED') order.paymentStatus = order.paymentMethod === 'COD' ? 'COD' : 'PAID';
  await order.save();
  return order;
}

export async function trackOrder(orderNumber: string, contact: string): Promise<IOrder> {
  const order = await Order.findOne({
    orderNumber,
    $or: [{ 'shippingAddress.email': contact.toLowerCase() }, { 'shippingAddress.phone': contact }],
  });
  if (!order) throw ApiError.notFound('Order not found. Please check your order ID and contact details.');
  return order;
}
