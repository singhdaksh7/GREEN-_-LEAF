import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import * as reviewRepository from '../../repositories/review.repository';

export const listAdminReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const isApproved = req.query.isApproved === undefined ? undefined : req.query.isApproved === 'true';

  const { reviews, total } = await reviewRepository.listAdminReviews({ isApproved, page, limit });

  sendSuccess(res, { reviews, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Reviews retrieved successfully');
});

export const setReviewApproval = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewRepository.setReviewApproval(req.params.id, Boolean(req.body.isApproved));
  if (!review) throw ApiError.notFound('Review not found');
  sendSuccess(res, review, 'Review moderation updated');
});
