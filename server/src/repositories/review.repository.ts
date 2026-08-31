import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';

export async function createReview(userId: string, productId: string, rating: number, title: string, description: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const verifiedPurchase = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, orderStatus: 'DELIVERED' } },
  });

  const review = await prisma.review.create({
    data: { productId, userId, rating, title, description, verifiedPurchase: Boolean(verifiedPurchase) },
  });

  await recalculateProductRating(productId);
  return review;
}

export async function recalculateProductRating(productId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.product.update({
    where: { id: productId },
    data: { averageRating: stats._avg.rating ?? 0, reviewCount: stats._count },
  });
}

export async function listApprovedReviewsForProduct(productId: string, page: number, limit: number) {
  const where = { productId, isApproved: true };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews, total };
}

export interface AdminReviewListOptions {
  isApproved?: boolean;
  page: number;
  limit: number;
}

export async function listAdminReviews(options: AdminReviewListOptions) {
  const where = options.isApproved === undefined ? {} : { isApproved: options.isApproved };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { product: { select: { name: true, slug: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews, total };
}

export async function setReviewApproval(id: string, isApproved: boolean) {
  const review = await prisma.review.update({ where: { id }, data: { isApproved } }).catch(() => null);
  if (!review) return null;
  await recalculateProductRating(review.productId);
  return review;
}
