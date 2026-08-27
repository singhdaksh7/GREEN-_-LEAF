import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Product } from '../../models/Product';
import { generateUniqueSlug } from '../../utils/slug';
import { buildSafeContainsRegex } from '../../utils/regex';

export const listAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = {};
  if (req.query.q) filter.name = buildSafeContainsRegex(String(req.query.q));
  if (req.query.category) filter.category = req.query.category;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('category', 'name'),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, { products, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Products retrieved successfully');
});

export const createAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const slug = await generateUniqueSlug(Product, req.body.name);
  const product = await Product.create({ ...req.body, slug });
  sendCreated(res, product, 'Product created successfully');
});

export const updateAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Product not found');

  const update = { ...req.body };
  if (req.body.name && req.body.name !== existing.name) {
    update.slug = await generateUniqueSlug(Product, req.body.name, req.params.id);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  sendSuccess(res, product, 'Product updated successfully');
});

export const deleteAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product, 'Product deactivated successfully');
});
