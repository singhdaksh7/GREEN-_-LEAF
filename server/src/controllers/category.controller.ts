import { Request, Response } from 'express';
import { Category } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as categoryRepository from '../repositories/category.repository';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryRepository.listActiveCategories();

  const byParent = new Map<string, Category[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }

  const attachChildren = (cat: Category): unknown => ({
    ...cat,
    children: (byParent.get(cat.id) ?? []).map(attachChildren),
  });

  const tree = (byParent.get('root') ?? []).map(attachChildren);
  sendSuccess(res, tree, 'Categories retrieved successfully');
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryRepository.findCategoryBySlug(req.params.slug);
  if (!category) throw ApiError.notFound('Category not found');

  const children = await categoryRepository.findChildCategories(category.id);
  sendSuccess(res, { ...category, children }, 'Category retrieved successfully');
});
