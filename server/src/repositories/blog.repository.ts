import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { generateUniqueSlug } from '../utils/slug';
import { ApiError } from '../utils/ApiError';

async function blogSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.blogPost.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return Boolean(existing);
}

export function listAdminBlogPosts() {
  return prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
}

export interface PublicBlogListOptions {
  category?: string;
  page: number;
  limit: number;
}

export async function listPublicBlogPosts(options: PublicBlogListOptions) {
  const where: Prisma.BlogPostWhereInput = {
    isPublished: true,
    ...(options.category ? { category: options.category as never } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total };
}

export async function getPublicBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
  if (!post) throw ApiError.notFound('Blog post not found');
  return post;
}

export interface BlogPostInput {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isPublished?: boolean;
}

export async function createAdminBlogPost(authorId: string, input: BlogPostInput) {
  const slug = await generateUniqueSlug(input.title, (s) => blogSlugExists(s));
  return prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      category: input.category as never,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage,
      isPublished: input.isPublished ?? false,
      publishedAt: input.isPublished ? new Date() : null,
      authorId,
    },
  });
}

export async function updateAdminBlogPost(id: string, input: Partial<BlogPostInput>) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Blog post not found');

  const data: Prisma.BlogPostUpdateInput = {};
  if (input.title !== undefined) {
    data.title = input.title;
    if (input.title !== existing.title) data.slug = await generateUniqueSlug(input.title, (s) => blogSlugExists(s, id));
  }
  if (input.category !== undefined) data.category = input.category as never;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) data.content = input.content;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.isPublished !== undefined) {
    data.isPublished = input.isPublished;
    if (input.isPublished && !existing.isPublished) data.publishedAt = new Date();
  }

  return prisma.blogPost.update({ where: { id }, data });
}

export async function unpublishAdminBlogPost(id: string) {
  const post = await prisma.blogPost.update({ where: { id }, data: { isPublished: false } }).catch(() => null);
  if (!post) throw ApiError.notFound('Blog post not found');
  return post;
}
