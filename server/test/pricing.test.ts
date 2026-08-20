import { describe, it, expect } from 'vitest';
import { computeShipping, applyCoupon, validateCouponEligibility, resolveProductPrice } from '../src/services/pricing.service';
import { ICoupon } from '../src/models/Coupon';
import { IProduct } from '../src/models/Product';

function makeCoupon(overrides: Partial<ICoupon> = {}): ICoupon {
  return {
    code: 'TEST10',
    type: 'PERCENTAGE',
    value: 10,
    minOrderValue: 0,
    maxDiscount: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    ...overrides,
  } as ICoupon;
}

function makeProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    name: 'Test Product',
    sku: 'SKU-1',
    mrp: 200,
    salePrice: 150,
    stock: 10,
    images: ['main.jpg'],
    variants: [
      { sku: 'SKU-1-V1', attributes: { size: 'Large' }, mrp: 300, salePrice: 220, stock: 5, images: ['variant.jpg'] },
    ],
    ...overrides,
  } as IProduct;
}

describe('computeShipping', () => {
  it('is free when subtotal meets threshold', () => {
    expect(computeShipping(1000, 999, 79)).toBe(0);
  });

  it('charges standard fee below threshold', () => {
    expect(computeShipping(500, 999, 79)).toBe(79);
  });

  it('is zero for an empty cart', () => {
    expect(computeShipping(0, 999, 79)).toBe(0);
  });
});

describe('applyCoupon', () => {
  it('applies percentage discount capped at maxDiscount', () => {
    const coupon = makeCoupon({ type: 'PERCENTAGE', value: 50, maxDiscount: 100 });
    const result = applyCoupon(1000, coupon);
    expect(result.discount).toBe(100);
  });

  it('applies flat discount capped at subtotal', () => {
    const coupon = makeCoupon({ type: 'FLAT', value: 5000 });
    const result = applyCoupon(300, coupon);
    expect(result.discount).toBe(300);
  });

  it('marks free shipping coupons without touching price', () => {
    const coupon = makeCoupon({ type: 'FREE_SHIPPING' });
    const result = applyCoupon(500, coupon);
    expect(result.discount).toBe(0);
    expect(result.freeShipping).toBe(true);
  });
});

describe('validateCouponEligibility', () => {
  it('rejects expired coupons', () => {
    const coupon = makeCoupon({ expiresAt: new Date(Date.now() - 1000) });
    expect(() => validateCouponEligibility(coupon, 1000)).toThrow();
  });

  it('rejects when below minimum order value', () => {
    const coupon = makeCoupon({ minOrderValue: 999 });
    expect(() => validateCouponEligibility(coupon, 500)).toThrow();
  });

  it('rejects when usage limit reached', () => {
    const coupon = makeCoupon({ usageLimit: 1, usedCount: 1 });
    expect(() => validateCouponEligibility(coupon, 1000)).toThrow();
  });

  it('passes for a valid, active coupon', () => {
    const coupon = makeCoupon({ minOrderValue: 100 });
    expect(() => validateCouponEligibility(coupon, 500)).not.toThrow();
  });
});

describe('resolveProductPrice', () => {
  it('resolves base product price when no variant is given', () => {
    const product = makeProduct();
    const resolved = resolveProductPrice(product);
    expect(resolved.unitPrice).toBe(150);
    expect(resolved.sku).toBe('SKU-1');
  });

  it('resolves variant price and stock when a variant sku is given', () => {
    const product = makeProduct();
    const resolved = resolveProductPrice(product, 'SKU-1-V1');
    expect(resolved.unitPrice).toBe(220);
    expect(resolved.stock).toBe(5);
    expect(resolved.variant).toEqual({ size: 'Large' });
  });

  it('throws when the variant sku does not exist on the product', () => {
    const product = makeProduct();
    expect(() => resolveProductPrice(product, 'MISSING')).toThrow();
  });
});
