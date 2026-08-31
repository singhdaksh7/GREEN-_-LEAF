import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as productRepository from '../repositories/product.repository';
import * as categoryRepository from '../repositories/category.repository';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  if (!q) {
    return sendSuccess(res, { products: [], page: 1, limit: 20, totalProducts: 0, totalPages: 1 }, 'Search results');
  }

  const result = await productRepository.listPublicProducts({
    q,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    sort: (req.query.sort as string) || 'featured',
  });

  sendSuccess(res, result, 'Search results');
});

export const suggest = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  if (q.length < 2) {
    return sendSuccess(res, { products: [], categories: [] }, 'Suggestions');
  }

  const [products, categories] = await Promise.all([
    productRepository.suggestProducts(q),
    categoryRepository.suggestCategories(q),
  ]);

  sendSuccess(res, { products, categories }, 'Suggestions');
});
