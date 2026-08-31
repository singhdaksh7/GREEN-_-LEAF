import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import * as blogRepository from '../../repositories/blog.repository';

export const listAdminBlogPosts = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await blogRepository.listAdminBlogPosts();
  sendSuccess(res, posts, 'Blog posts retrieved successfully');
});

export const createAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogRepository.createAdminBlogPost(req.user!.id, req.body);
  sendCreated(res, post, 'Blog post created successfully');
});

export const updateAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogRepository.updateAdminBlogPost(req.params.id, req.body);
  sendSuccess(res, post, 'Blog post updated successfully');
});

export const deleteAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogRepository.unpublishAdminBlogPost(req.params.id);
  sendSuccess(res, post, 'Blog post unpublished');
});
