import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as wishlistRepository from '../repositories/wishlist.repository';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistRepository.getOrCreateWishlist(req.user!.id);
  sendSuccess(res, wishlist, 'Wishlist retrieved successfully');
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;
  const wishlist = await wishlistRepository.addToWishlist(req.user!.id, productId);
  sendSuccess(res, wishlist, 'Added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const wishlist = await wishlistRepository.removeFromWishlist(req.user!.id, productId);
  sendSuccess(res, wishlist, 'Removed from wishlist');
});
