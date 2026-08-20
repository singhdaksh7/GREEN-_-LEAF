import { Schema, model, Types, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: Types.ObjectId | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: {
      type: String,
      enum: ['Gardening Tips', 'Home Gardening', 'Plant Care', 'Fertilizers', 'DIY Gardening'],
      required: true,
    },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const BlogPost = model<IBlogPost>('BlogPost', blogPostSchema);
