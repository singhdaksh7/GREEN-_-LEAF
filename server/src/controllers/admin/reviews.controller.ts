import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Review } from '../../models/Review';
import { recalculateProductRating } from '../../services/review.service';

export const listAdminReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = {};
  if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('product', 'name slug').populate('user', 'firstName lastName'),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, { reviews, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Reviews retrieved successfully');
});

export const setReviewApproval = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: Boolean(req.body.isApproved) }, { new: true });
  if (!review) throw ApiError.notFound('Review not found');
  await recalculateProductRating(review.product.toString());
  sendSuccess(res, review, 'Review moderation updated');
});
