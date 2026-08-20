import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as cartService from '../services/cart.service';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getOrCreateCart(req.user!.id);
  const priced = await cartService.priceCart(cart);
  sendSuccess(res, priced, 'Cart retrieved successfully');
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantSku, quantity } = req.body;
  const cart = await cartService.addItemToCart(req.user!.id, productId, variantSku ?? null, quantity ?? 1);
  const priced = await cartService.priceCart(cart);
  sendSuccess(res, priced, 'Item added to cart');
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantSku, quantity } = req.body;
  const cart = await cartService.updateCartItem(req.user!.id, productId, variantSku ?? null, quantity);
  const priced = await cartService.priceCart(cart);
  sendSuccess(res, priced, 'Cart updated');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const variantSku = (req.query.variantSku as string | undefined) ?? null;
  const cart = await cartService.removeCartItem(req.user!.id, productId, variantSku);
  const priced = await cartService.priceCart(cart);
  sendSuccess(res, priced, 'Item removed from cart');
});

export const clearCartHandler = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);
  sendSuccess(res, null, 'Cart cleared');
});
