import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { Review } from '../models/Review';
import * as reviewService from '../services/review.service';

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId, page = '1', limit = '10' } = req.query as Record<string, string>;
  const p = Number(page) || 1;
  const l = Math.min(50, Number(limit) || 10);

  const filter = { product: productId, isApproved: true };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).populate('user', 'name'),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, { reviews, page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)) }, 'Reviews retrieved successfully');
});

export const createReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, description } = req.body;
  const review = await reviewService.createReview(req.user!.id, productId, rating, title, description);
  sendCreated(res, review, 'Review submitted successfully');
});
