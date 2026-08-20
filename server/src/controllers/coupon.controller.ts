import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Coupon } from '../models/Coupon';
import * as cartService from '../services/cart.service';
import { applyCoupon, validateCouponEligibility } from '../services/pricing.service';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
  if (!coupon) throw ApiError.notFound('Invalid coupon code');

  const cart = await cartService.getOrCreateCart(req.user!.id);
  const priced = await cartService.priceCart(cart);

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
