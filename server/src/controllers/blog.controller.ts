import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as blogRepository from '../repositories/blog.repository';

export const listBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(30, Number(req.query.limit) || 9);

  const { posts, total } = await blogRepository.listPublicBlogPosts({
    category: req.query.category ? String(req.query.category) : undefined,
    page,
    limit,
  });

  sendSuccess(res, { posts, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Blog posts retrieved successfully');
});

export const getBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await blogRepository.getPublicBlogPostBySlug(req.params.slug);
  sendSuccess(res, post, 'Blog post retrieved successfully');
});
