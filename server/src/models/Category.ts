import { Schema, model, Types, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', categorySchema);
