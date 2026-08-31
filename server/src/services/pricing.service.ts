import { Coupon } from '@prisma/client';
import { ProductWithRelations } from '../repositories/product.repository';
import { ApiError } from '../utils/ApiError';

export interface ResolvedLine {
  sku: string;
  productName: string;
  productImage: string;
  variant: Record<string, string> | null;
  mrp: number;
  unitPrice: number;
  stock: number;
}

export function resolveProductPrice(product: ProductWithRelations, variantSku?: string | null): ResolvedLine {
  if (variantSku) {
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) throw ApiError.badRequest(`Variant ${variantSku} not found for product ${product.name}`);
    return {
      sku: variant.sku,
      productName: product.name,
      productImage: variant.images[0]?.url ?? product.images[0]?.url ?? '',
      variant: Object.fromEntries(variant.attributes.map((a) => [a.key, a.value])),
      mrp: Number(variant.mrp),
      unitPrice: Number(variant.salePrice),
      stock: variant.stock,
    };
  }

  return {
    sku: product.sku,
    productName: product.name,
    productImage: product.images[0]?.url ?? '',
    variant: null,
    mrp: Number(product.mrp),
    unitPrice: Number(product.salePrice),
    stock: product.stock,
  };
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

export function computeShipping(subtotal: number, freeShippingThreshold: number, standardShippingFee: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
}

export function applyCoupon(subtotal: number, coupon: Coupon | null): { discount: number; freeShipping: boolean } {
  if (!coupon) return { discount: 0, freeShipping: false };

  if (coupon.type === 'FREE_SHIPPING') return { discount: 0, freeShipping: true };

  if (coupon.type === 'FLAT') {
    return { discount: Math.min(coupon.value, subtotal), freeShipping: false };
  }

  // PERCENTAGE
  let discount = (subtotal * coupon.value) / 100;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: Math.min(discount, subtotal), freeShipping: false };
}

export function validateCouponEligibility(coupon: Coupon, subtotal: number): void {
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest(`Minimum order value of ₹${coupon.minOrderValue} required for this coupon`);
  }
}
