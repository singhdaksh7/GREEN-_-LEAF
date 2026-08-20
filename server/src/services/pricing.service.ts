import { IProduct } from '../models/Product';
import { ICoupon } from '../models/Coupon';
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

export function resolveProductPrice(product: IProduct, variantSku?: string | null): ResolvedLine {
  if (variantSku) {
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant) throw ApiError.badRequest(`Variant ${variantSku} not found for product ${product.name}`);
    return {
      sku: variant.sku,
      productName: product.name,
      productImage: variant.images[0] ?? product.images[0] ?? '',
      variant: variant.attributes,
      mrp: variant.mrp,
      unitPrice: variant.salePrice,
      stock: variant.stock,
    };
  }

  return {
    sku: product.sku,
    productName: product.name,
    productImage: product.images[0] ?? '',
    variant: null,
    mrp: product.mrp,
    unitPrice: product.salePrice,
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

export function applyCoupon(subtotal: number, coupon: ICoupon | null): { discount: number; freeShipping: boolean } {
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

export function validateCouponEligibility(coupon: ICoupon, subtotal: number): void {
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest(`Minimum order value of ₹${coupon.minOrderValue} required for this coupon`);
  }
}
