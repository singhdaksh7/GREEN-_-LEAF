import { Schema, model, Types, Document } from 'mongoose';

export interface IReview extends Document {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title: string;
  description: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    description: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
