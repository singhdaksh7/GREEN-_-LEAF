import { Schema, model, Document } from 'mongoose';

export type CouponType = 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['PERCENTAGE', 'FLAT', 'FREE_SHIPPING'], required: true },
    value: { type: Number, required: true, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
