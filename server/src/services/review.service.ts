import { Types } from 'mongoose';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { ApiError } from '../utils/ApiError';

export async function createReview(userId: string, productId: string, rating: number, title: string, description: string) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await Review.findOne({ product: productId, user: userId });
  if (existing) throw ApiError.conflict('You have already reviewed this product');

  const verifiedPurchase = await Order.exists({
    user: userId,
    'items.product': productId,
    orderStatus: 'DELIVERED',
  });

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    title,
    description,
    verifiedPurchase: Boolean(verifiedPurchase),
  });

  await recalculateProductRating(productId);
  return review;
}

export async function recalculateProductRating(productId: string) {
  const stats = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] ?? {};
  await Product.findByIdAndUpdate(productId, { averageRating: avgRating, reviewCount: count });
}
