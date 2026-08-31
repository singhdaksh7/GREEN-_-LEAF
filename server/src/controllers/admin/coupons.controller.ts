import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import * as couponRepository from '../../repositories/coupon.repository';

export const listAdminCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponRepository.listAdminCoupons();
  sendSuccess(res, coupons, 'Coupons retrieved successfully');
});

export const createAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponRepository.createAdminCoupon(req.body);
  sendCreated(res, coupon, 'Coupon created successfully');
});

export const updateAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponRepository.updateAdminCoupon(req.params.id, req.body);
  sendSuccess(res, coupon, 'Coupon updated successfully');
});

export const disableAdminCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponRepository.disableAdminCoupon(req.params.id);
  sendSuccess(res, coupon, 'Coupon disabled successfully');
});
