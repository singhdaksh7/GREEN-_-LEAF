import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';

export function findByCode(code: string) {
  return prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
}

export function listAdminCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

export interface CouponInput {
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export async function createAdminCoupon(input: CouponInput) {
  const code = input.code.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');

  return prisma.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value ?? 0,
      minOrderValue: input.minOrderValue ?? 0,
      maxDiscount: input.maxDiscount ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      usageLimit: input.usageLimit ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateAdminCoupon(id: string, input: Partial<CouponInput>) {
  const data: Prisma.CouponUpdateInput = {};
  if (input.code !== undefined) data.code = input.code.toUpperCase();
  if (input.type !== undefined) data.type = input.type;
  if (input.value !== undefined) data.value = input.value;
  if (input.minOrderValue !== undefined) data.minOrderValue = input.minOrderValue;
  if (input.maxDiscount !== undefined) data.maxDiscount = input.maxDiscount;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const coupon = await prisma.coupon.update({ where: { id }, data }).catch(() => null);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}

export async function disableAdminCoupon(id: string) {
  const coupon = await prisma.coupon.update({ where: { id }, data: { isActive: false } }).catch(() => null);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}
