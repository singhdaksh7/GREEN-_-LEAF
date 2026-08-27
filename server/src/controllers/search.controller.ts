import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { listProducts } from '../services/product.service';
import { buildSafeContainsRegex } from '../utils/regex';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  if (!q) {
    return sendSuccess(res, { products: [], page: 1, limit: 20, totalProducts: 0, totalPages: 1 }, 'Search results');
  }

  const result = await listProducts({
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

  const regex = buildSafeContainsRegex(q);

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true, $or: [{ name: regex }, { tags: regex }, { brand: regex }] })
      .select('name slug images salePrice mrp')
      .limit(6)
      .lean(),
    Category.find({ isActive: true, name: regex }).select('name slug').limit(4).lean(),
  ]);

  sendSuccess(res, { products, categories }, 'Suggestions');
});
