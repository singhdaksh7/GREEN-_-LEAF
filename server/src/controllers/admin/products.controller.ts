import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Product, IProductImage } from '../../models/Product';
import { generateUniqueSlug } from '../../utils/slug';
import { buildSafeContainsRegex } from '../../utils/regex';
import { storageProvider } from '../../storage';
import { deriveThumbnailKey } from '../../config/upload';

export const listAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = {};
  if (req.query.q) filter.name = buildSafeContainsRegex(String(req.query.q));
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('category', 'name'),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, { products, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Products retrieved successfully');
});

export const getAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  // Unlike the public product controller, this intentionally does not filter
  // by status/isActive — admins must be able to fetch and edit drafts and
  // archived products, not just published ones.
  const product = await Product.findById(req.params.id).populate('category', 'name').populate('subcategory', 'name');
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product, 'Product retrieved successfully');
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

  const previousImageKeys = existing.images.map((image) => image.key).filter(Boolean);

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

  // Only delete files after the DB update has succeeded, and only ones that
  // were actually dropped from the gallery — never block or fail the
  // response on a storage cleanup error, just log it.
  if (Array.isArray(req.body.images)) {
    const newImageKeys = new Set((req.body.images as IProductImage[]).map((image) => image.key).filter(Boolean));
    const removedKeys = previousImageKeys.filter((key) => !newImageKeys.has(key));
    const keysToDelete = removedKeys.flatMap((key) => [key, deriveThumbnailKey(key)]);
    await Promise.all(
      keysToDelete.map((key) =>
        storageProvider.delete(key).catch((error) => {
          console.warn(`[uploads] Failed to delete orphaned product image "${key}":`, error);
        })
      )
    );
  }

  sendSuccess(res, product, 'Product updated successfully');
});

export const deleteAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { status: 'ARCHIVED' }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product, 'Product archived successfully');
});
