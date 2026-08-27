import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { listProducts, getProductBySlug, getRelatedProducts } from '../services/product.service';
import { Review } from '../models/Review';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await listProducts({
    category: req.query.category as string | undefined,
    subcategory: req.query.subcategory as string | undefined,
    minPrice: toNumber(req.query.minPrice),
    maxPrice: toNumber(req.query.maxPrice),
    inStock: req.query.inStock === 'true',
    minRating: toNumber(req.query.minRating),
    minDiscount: toNumber(req.query.minDiscount),
    brand: req.query.brand as string | undefined,
    tag: req.query.tag as string | undefined,
    q: req.query.q as string | undefined,
    featured: req.query.featured === 'true',
    bestSeller: req.query.bestSeller === 'true',
    newArrival: req.query.newArrival === 'true',
    sort: req.query.sort as string | undefined,
    page: toNumber(req.query.page),
    limit: toNumber(req.query.limit),
  });

  sendSuccess(res, result, 'Products retrieved successfully');
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductBySlug(req.params.slug);
  if (!product) throw ApiError.notFound('Product not found');

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product),
    Review.find({ product: product._id, isApproved: true }).sort({ createdAt: -1 }).limit(10).populate('user', 'name'),
  ]);

  sendSuccess(res, { product, related, reviews }, 'Product retrieved successfully');
});
