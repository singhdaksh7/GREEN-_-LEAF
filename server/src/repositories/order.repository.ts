import { Prisma, OrderStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { generateOrderNumber } from '../utils/orderNumber';
import * as cartRepository from './cart.repository';
import * as couponRepository from './coupon.repository';
import { decrementStockForLines, reserveCoupon } from './commerce-transaction.helpers';
import { applyCoupon, validateCouponEligibility } from '../services/pricing.service';

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

const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

function shippingAddressData(address: ShippingAddressInput) {
  return {
    shippingFullName: address.fullName,
    shippingPhone: address.phone,
    shippingEmail: address.email,
    shippingAddressLine: address.addressLine,
    shippingLocality: address.locality,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPincode: address.pincode,
  };
}

export async function createOrder(
  userId: string,
  shippingAddress: ShippingAddressInput,
  paymentMethod: PaymentMethod,
  couponCode: string | null
) {
  const cart = await cartRepository.getOrCreateCart(userId);
  if (cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const priced = await cartRepository.priceCart(cart);

  const outOfStock = priced.lines.filter((line) => !line.inStock);
  if (outOfStock.length > 0) {
    throw ApiError.badRequest(`Insufficient stock for: ${outOfStock.map((l) => l.name).join(', ')}`);
  }

  let discount = 0;
  let freeShipping = false;
  let coupon = null;

  if (couponCode) {
    coupon = await couponRepository.findByCode(couponCode);
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
  // actually reserved. prisma.$transaction gives us that atomicity instead
  // of hand-rolling compensating writes for every failure path.
  return prisma.$transaction(async (tx) => {
    await decrementStockForLines(tx, priced.lines);
    if (coupon) await reserveCoupon(tx, coupon.code);

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        ...shippingAddressData(shippingAddress),
        subtotal: priced.subtotal,
        discount,
        shipping,
        tax,
        grandTotal,
        couponCode: coupon?.code ?? null,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'COD' : 'PENDING',
        orderStatus: 'PENDING',
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productName: line.name,
            productImage: line.image,
            sku: line.sku,
            variant: line.variant ?? Prisma.JsonNull,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
          })),
        },
        statusHistory: { create: [{ status: 'PENDING' }] },
      },
      include: ORDER_INCLUDE,
    });

    await cartRepository.clearCart(userId, tx);

    return created;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) throw ApiError.notFound('Order not found');

  return prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: status,
      paymentStatus: status === 'DELIVERED' ? (existing.paymentMethod === 'COD' ? 'COD' : 'PAID') : undefined,
      statusHistory: { create: [{ status, note }] },
    },
    include: ORDER_INCLUDE,
  });
}

export async function trackOrder(orderNumber: string, contact: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      OR: [{ shippingEmail: contact.toLowerCase() }, { shippingPhone: contact }],
    },
    include: ORDER_INCLUDE,
  });
  if (!order) throw ApiError.notFound('Order not found. Please check your order ID and contact details.');
  return order;
}

export function listMyOrders(userId: string) {
  return prisma.order.findMany({ where: { userId }, include: ORDER_INCLUDE, orderBy: { createdAt: 'desc' } });
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: ORDER_INCLUDE });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

export interface AdminOrderListOptions {
  status?: OrderStatus;
  paymentStatus?: Prisma.OrderWhereInput['paymentStatus'];
  page: number;
  limit: number;
}

export async function listAdminOrders(options: AdminOrderListOptions) {
  const where: Prisma.OrderWhereInput = {
    ...(options.status ? { orderStatus: options.status } : {}),
    ...(options.paymentStatus ? { paymentStatus: options.paymentStatus } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { ...ORDER_INCLUDE, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...ORDER_INCLUDE, user: { select: { name: true, email: true } } },
  });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}
