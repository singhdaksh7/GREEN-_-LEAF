import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import * as reviewRepository from '../repositories/review.repository';

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId, page = '1', limit = '10' } = req.query as Record<string, string>;
  const p = Number(page) || 1;
  const l = Math.min(50, Number(limit) || 10);

  const { reviews, total } = await reviewRepository.listApprovedReviewsForProduct(productId, p, l);

  sendSuccess(res, { reviews, page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)) }, 'Reviews retrieved successfully');
});

export const createReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, title, description } = req.body;
  const review = await reviewRepository.createReview(req.user!.id, productId, rating, title, description);
  sendCreated(res, review, 'Review submitted successfully');
});
