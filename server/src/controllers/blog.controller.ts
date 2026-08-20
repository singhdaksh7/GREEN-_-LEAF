import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { BlogPost } from '../models/BlogPost';

export const listBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(30, Number(req.query.limit) || 9);
  const filter: Record<string, unknown> = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit),
    BlogPost.countDocuments(filter),
  ]);

  sendSuccess(res, { posts, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Blog posts retrieved successfully');
});

export const getBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
  if (!post) throw ApiError.notFound('Blog post not found');
  sendSuccess(res, post, 'Blog post retrieved successfully');
});
