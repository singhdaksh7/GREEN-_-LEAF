// Raw shapes of the legacy Mongo collections, as they existed under the
// Mongoose models that were removed from server/src/models when the
// production app moved to Prisma/MySQL (see server/src/config/db.ts). These
// intentionally duplicate only what this one-time migration reads — they
// are NOT kept in sync with any live schema.
import { ObjectId } from 'mongodb';

export interface MongoUser {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
  tokenVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoAddress {
  _id: ObjectId;
  user: ObjectId;
  fullName: string;
  phone: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoCategory {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent: ObjectId | null;
  order?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoProductImage {
  url: string;
  key?: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface MongoProductVariant {
  _id: ObjectId;
  sku: string;
  attributes?: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images?: string[];
}

export interface MongoProduct {
  _id: ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  howToUse?: string;
  sku: string;
  brand?: string;
  category: ObjectId;
  subcategory?: ObjectId | null;
  images?: (MongoProductImage | string)[];
  variants?: MongoProductVariant[];
  mrp: number;
  salePrice: number;
  stock?: number;
  tags?: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  averageRating?: number;
  reviewCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoCoupon {
  _id: ObjectId;
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';
  value?: number;
  minOrderValue?: number;
  maxDiscount?: number | null;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usedCount?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoReview {
  _id: ObjectId;
  product: ObjectId;
  user: ObjectId;
  rating: number;
  title: string;
  description: string;
  verifiedPurchase?: boolean;
  isApproved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoOrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export interface MongoOrderItem {
  product: ObjectId | null;
  productName: string;
  productImage: string;
  sku: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MongoStatusHistoryEntry {
  status: string;
  changedAt: Date;
  note?: string;
}

export interface MongoOrder {
  _id: ObjectId;
  orderNumber: string;
  user: ObjectId;
  items: MongoOrderItem[];
  shippingAddress: MongoOrderAddress;
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  grandTotal: number;
  couponCode?: string | null;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'COD';
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  orderStatus: string;
  statusHistory?: MongoStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoPaymentIntentLine {
  productId: ObjectId;
  variantSku: string | null;
  name: string;
  image: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MongoPaymentIntent {
  _id: ObjectId;
  user: ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  amount: number;
  currency?: string;
  status: 'CREATED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REQUIRES_REFUND';
  failureReason?: string | null;
  shippingAddress: MongoOrderAddress;
  couponCode?: string | null;
  lines: MongoPaymentIntentLine[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  grandTotal: number;
  order?: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoBlogPost {
  _id: ObjectId;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author?: ObjectId | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoNewsletterSubscriber {
  _id: ObjectId;
  email: string;
  isActive?: boolean;
  createdAt: Date;
}

export interface MongoBulkOrderInquiry {
  _id: ObjectId;
  fullName: string;
  company?: string;
  email: string;
  mobile: string;
  pincode: string;
  product?: string;
  quantity: number;
  targetPrice?: number;
  expectedPurchaseDate?: Date;
  requirement?: string;
  message?: string;
  status?: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
  createdAt: Date;
}

export interface MongoCartItem {
  product: ObjectId;
  variantSku: string | null;
  quantity: number;
}

export interface MongoCart {
  _id: ObjectId;
  user: ObjectId;
  items: MongoCartItem[];
}

export interface MongoWishlist {
  _id: ObjectId;
  user: ObjectId;
  products: ObjectId[];
}

export const BLOG_CATEGORY_MAP: Record<string, string> = {
  'Gardening Tips': 'GARDENING_TIPS',
  'Home Gardening': 'HOME_GARDENING',
  'Plant Care': 'PLANT_CARE',
  Fertilizers: 'FERTILIZERS',
  'DIY Gardening': 'DIY_GARDENING',
};
