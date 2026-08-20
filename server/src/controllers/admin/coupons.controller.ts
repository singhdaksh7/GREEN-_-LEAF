import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Coupon } from '../../models/Coupon';

export const listAdminCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendSuccess(res, coupons, 'Coupons retrieved successfully');
});

export const createAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Coupon.findOne({ code: String(req.body.code).toUpperCase() });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');

  const coupon = await Coupon.create({
    ...req.body,
    code: String(req.body.code).toUpperCase(),
    expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
  });
  sendCreated(res, coupon, 'Coupon created successfully');
});

export const updateAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const update = { ...req.body };
  if (update.code) update.code = String(update.code).toUpperCase();
  if (update.expiresAt) update.expiresAt = new Date(update.expiresAt);

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  sendSuccess(res, coupon, 'Coupon updated successfully');
});

export const disableAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  sendSuccess(res, coupon, 'Coupon disabled successfully');
});
