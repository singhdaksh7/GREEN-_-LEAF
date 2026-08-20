import { Schema, model, Document } from 'mongoose';

export type BulkOrderStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';

export interface IBulkOrderInquiry extends Document {
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
  status: BulkOrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bulkOrderInquirySchema = new Schema<IBulkOrderInquiry>(
  {
    fullName: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    pincode: { type: String, required: true },
    product: { type: String },
    quantity: { type: Number, required: true },
    targetPrice: { type: Number },
    expectedPurchaseDate: { type: Date },
    requirement: { type: String },
    message: { type: String },
    status: { type: String, enum: ['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'], default: 'NEW' },
  },
  { timestamps: true }
);

export const BulkOrderInquiry = model<IBulkOrderInquiry>('BulkOrderInquiry', bulkOrderInquirySchema);
