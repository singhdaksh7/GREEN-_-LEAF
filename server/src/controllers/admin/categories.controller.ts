import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import * as categoryRepository from '../../repositories/category.repository';

export const listAdminCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryRepository.listAllCategories();
  sendSuccess(res, categories, 'Categories retrieved successfully');
});

export const createAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, ...rest } = req.body;
  const category = await categoryRepository.createCategory(
    { ...rest, name, parent: rest.parent ? { connect: { id: rest.parent } } : undefined },
    name
  );
  sendCreated(res, category, 'Category created successfully');
});

export const updateAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  const { parent, ...rest } = req.body;
  const category = await categoryRepository.updateCategory(req.params.id, {
    ...rest,
    ...(parent !== undefined ? { parent: parent ? { connect: { id: parent } } : { disconnect: true } } : {}),
  });
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, category, 'Category updated successfully');
});

export const deleteAdminCategory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const category = await categoryRepository.deactivateCategory(req.params.id);
    sendSuccess(res, category, 'Category deactivated successfully');
  } catch {
    throw ApiError.notFound('Category not found');
  }
});
