import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as productRepository from '../repositories/product.repository';
import * as reviewRepository from '../repositories/review.repository';

const attributeQueryKey = /^attr_([A-Za-z][A-Za-z0-9_]{0,39})$/;

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const attributes: Record<string, string[]> = {};
  Object.entries(req.query).forEach(([key, rawValue]) => {
    const match = attributeQueryKey.exec(key);
    if (!match || typeof rawValue !== 'string') return;
    const values = rawValue.split(',').map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= 80).slice(0, 20);
    if (values.length) attributes[match[1]] = values;
  });
  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);
  if ((minPrice !== undefined && minPrice < 0) || (maxPrice !== undefined && maxPrice < 0) || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    throw ApiError.badRequest('Price filters must be non-negative and minimum cannot exceed maximum');
  }
  const result = await productRepository.listPublicProducts({
    category: req.query.category as string | undefined,
    subcategory: req.query.subcategory as string | undefined,
    minPrice, maxPrice,
    inStock: req.query.inStock === 'true',
    minRating: toNumber(req.query.minRating),
    minDiscount: toNumber(req.query.minDiscount),
    brand: req.query.brand as string | undefined,
    attributes,
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
  const product = await productRepository.findProductBySlug(req.params.slug, true);
  if (!product) throw ApiError.notFound('Product not found');

  const [related, { reviews }] = await Promise.all([
    productRepository.getRelatedProducts(product),
    reviewRepository.listApprovedReviewsForProduct(product.id, 1, 10),
  ]);

  sendSuccess(res, { product: productRepository.toApiProduct(product), related, reviews }, 'Product retrieved successfully');
});
