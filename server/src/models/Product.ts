import { Schema, model, Types, Document } from 'mongoose';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IProductVariant {
  sku: string;
  attributes: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images: string[];
}

export interface IProductImage {
  url: string;
  key: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  howToUse?: string;
  sku: string;
  brand: string;
  category: Types.ObjectId;
  subcategory: Types.ObjectId | null;
  images: IProductImage[];
  variants: IProductVariant[];
  mrp: number;
  salePrice: number;
  stock: number;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  averageRating: number;
  reviewCount: number;
  seoTitle?: string;
  seoDescription?: string;
  status: ProductStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
  },
  { _id: true }
);

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    key: { type: String, default: '' },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    howToUse: { type: String },
    sku: { type: String, required: true, unique: true },
    brand: { type: String, default: 'GreenKart' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    images: [imageSchema],
    variants: [variantSchema],
    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    tags: [{ type: String, index: true }],
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    seoTitle: { type: String },
    seoDescription: { type: String },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
    // Derived from `status` (see pre-save hook below) — kept for backward
    // compatibility since the storefront/cart/order/search/sitemap queries
    // all filter on this flag. Never set directly from admin input.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Normalizes legacy documents on read: older seeded/demo products stored
// `images` as plain URL strings and had no `status` field at all. This lets
// the new structured-image + draft/published model apply to old data
// without a manual migration script, mirroring how placeholderImage.ts was
// designed to be swappable "without touching callers".
productSchema.pre('init', function normalizeLegacyProduct(rawDoc: unknown) {
  const doc = rawDoc as { images?: unknown[]; status?: ProductStatus; isActive?: boolean };

  if (Array.isArray(doc.images)) {
    doc.images = doc.images.map((image, index) => {
      if (typeof image === 'string') {
        return { url: image, key: '', alt: '', isPrimary: index === 0, sortOrder: index };
      }
      return image;
    });
  }

  if (!doc.status) {
    doc.status = doc.isActive === false ? 'ARCHIVED' : 'PUBLISHED';
  }
});

// `isActive` is a derived read model of `status`, kept in sync on every save
// so every existing `isActive: true` query across the codebase (storefront
// listings, cart, checkout, search, sitemap, low-stock dashboard) continues
// to work unchanged.
productSchema.pre('save', function syncIsActiveFromStatus(next) {
  this.isActive = this.status === 'PUBLISHED';
  next();
});

// Admin create/update/archive flows use findByIdAndUpdate (query middleware,
// not document middleware), so `status` must also be synced to `isActive`
// here — pre('save') alone would never run for those calls.
productSchema.pre('findOneAndUpdate', function syncIsActiveOnFindOneAndUpdate(next) {
  const update = this.getUpdate() as { status?: ProductStatus; isActive?: boolean } | null;
  if (update && update.status) {
    update.isActive = update.status === 'PUBLISHED';
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text', sku: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ bestSeller: 1, newArrival: 1, featured: 1 });

export const Product = model<IProduct>('Product', productSchema);
