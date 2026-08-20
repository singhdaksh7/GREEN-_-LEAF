import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { Wishlist } from '../models/Wishlist';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user!.id },
    { $setOnInsert: { user: req.user!.id, products: [] } },
    { upsert: true, new: true }
  ).populate('products');

  sendSuccess(res, wishlist, 'Wishlist retrieved successfully');
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user!.id },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  ).populate('products');

  sendSuccess(res, wishlist, 'Added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user!.id },
    { $pull: { products: productId } },
    { upsert: true, new: true }
  ).populate('products');

  sendSuccess(res, wishlist, 'Removed from wishlist');
});
