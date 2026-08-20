import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Category } from '../../models/Category';
import { generateUniqueSlug } from '../../utils/slug';

export const listAdminCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).populate('parent', 'name');
  sendSuccess(res, categories, 'Categories retrieved successfully');
});

export const createAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const slug = await generateUniqueSlug(Category, req.body.name);
  const category = await Category.create({ ...req.body, slug });
  sendCreated(res, category, 'Category created successfully');
});

export const updateAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Category.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Category not found');

  const update = { ...req.body };
  if (req.body.name && req.body.name !== existing.name) {
    update.slug = await generateUniqueSlug(Category, req.body.name, req.params.id);
  }

  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  sendSuccess(res, category, 'Category updated successfully');
});

export const deleteAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, category, 'Category deactivated successfully');
});
