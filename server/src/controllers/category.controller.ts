import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Category } from '../models/Category';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();

  const byParent = new Map<string, typeof categories>();
  for (const cat of categories) {
    const key = cat.parent ? String(cat.parent) : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }

  const attachChildren = (cat: (typeof categories)[number]): unknown => ({
    ...cat,
    children: (byParent.get(String(cat._id)) ?? []).map(attachChildren),
  });

  const tree = (byParent.get('root') ?? []).map(attachChildren);
  sendSuccess(res, tree, 'Categories retrieved successfully');
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found');

  const children = await Category.find({ parent: category._id, isActive: true }).sort({ order: 1 }).lean();
  sendSuccess(res, { ...category, children }, 'Category retrieved successfully');
});
