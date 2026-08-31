import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as couponRepository from '../repositories/coupon.repository';
import * as cartRepository from '../repositories/cart.repository';
import { applyCoupon, validateCouponEligibility } from '../services/pricing.service';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const coupon = await couponRepository.findByCode(String(code));
  if (!coupon) throw ApiError.notFound('Invalid coupon code');

  const cart = await cartRepository.getOrCreateCart(req.user!.id);
  const priced = await cartRepository.priceCart(cart);

  validateCouponEligibility(coupon, priced.subtotal);
  const { discount, freeShipping } = applyCoupon(priced.subtotal, coupon);

  sendSuccess(res, {
    code: coupon.code,
    type: coupon.type,
    discount,
    freeShipping,
    subtotal: priced.subtotal,
  }, 'Coupon applied successfully');
});
