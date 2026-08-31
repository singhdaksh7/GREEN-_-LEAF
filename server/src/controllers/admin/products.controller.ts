import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import * as productRepository from '../../repositories/product.repository';
import { storageProvider } from '../../storage';
import { deriveThumbnailKey } from '../../config/upload';

export const listAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const { products, total } = await productRepository.listAdminProducts({
    q: req.query.q ? String(req.query.q) : undefined,
    category: req.query.category ? String(req.query.category) : undefined,
    status: req.query.status as never,
    page,
    limit,
  });

  sendSuccess(res, { products, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Products retrieved successfully');
});

export const getAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  // Unlike the public product controller, this intentionally does not filter
  // by status — admins must be able to fetch and edit drafts and archived
  // products, not just published ones.
  const product = await productRepository.findProductById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, productRepository.toApiProduct(product), 'Product retrieved successfully');
});

export const createAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productRepository.createProduct(req.body);
  sendCreated(res, productRepository.toApiProduct(product), 'Product created successfully');
});

export const updateAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await productRepository.findProductById(req.params.id);
  if (!existing) throw ApiError.notFound('Product not found');

  const previousImageKeys = existing.images.map((image) => image.key).filter(Boolean);

  const product = await productRepository.updateProduct(req.params.id, req.body);
  if (!product) throw ApiError.notFound('Product not found');

  // Only delete files after the DB update has succeeded, and only ones that
  // were actually dropped from the gallery — never block or fail the
  // response on a storage cleanup error, just log it.
  if (Array.isArray(req.body.images)) {
    const newImageKeys = new Set((req.body.images as { key?: string }[]).map((image) => image.key).filter(Boolean));
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

  sendSuccess(res, productRepository.toApiProduct(product), 'Product updated successfully');
});

export const deleteAdminProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productRepository.archiveProduct(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  // Derived from `status`, never stored — see toApiProduct in
  // product.repository.ts for why.
  sendSuccess(res, { ...product, isActive: product.status === 'PUBLISHED' }, 'Product archived successfully');
});
