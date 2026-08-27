import { Schema, model, Types, Document } from 'mongoose';

export interface IProductVariant {
  sku: string;
  attributes: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images: string[];
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
  images: string[];
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
    images: [{ type: String }],
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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text', sku: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ bestSeller: 1, newArrival: 1, featured: 1 });

export const Product = model<IProduct>('Product', productSchema);
