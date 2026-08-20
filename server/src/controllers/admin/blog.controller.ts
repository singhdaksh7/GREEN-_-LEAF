import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { BlogPost } from '../../models/BlogPost';
import { generateUniqueSlug } from '../../utils/slug';

export const listAdminBlogPosts = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await BlogPost.find().sort({ createdAt: -1 });
  sendSuccess(res, posts, 'Blog posts retrieved successfully');
});

export const createAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const slug = await generateUniqueSlug(BlogPost, req.body.title);
  const post = await BlogPost.create({
    ...req.body,
    slug,
    author: req.user!.id,
    publishedAt: req.body.isPublished ? new Date() : null,
  });
  sendCreated(res, post, 'Blog post created successfully');
});

export const updateAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const existing = await BlogPost.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Blog post not found');

  const update = { ...req.body };
  if (req.body.title && req.body.title !== existing.title) {
    update.slug = await generateUniqueSlug(BlogPost, req.body.title, req.params.id);
  }
  if (req.body.isPublished && !existing.isPublished) {
    update.publishedAt = new Date();
  }

  const post = await BlogPost.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  sendSuccess(res, post, 'Blog post updated successfully');
});

export const deleteAdminBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await BlogPost.findByIdAndUpdate(req.params.id, { isPublished: false }, { new: true });
  if (!post) throw ApiError.notFound('Blog post not found');
  sendSuccess(res, post, 'Blog post unpublished');
});
