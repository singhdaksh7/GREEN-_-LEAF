import { Schema, model, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = model<INewsletterSubscriber>('NewsletterSubscriber', newsletterSubscriberSchema);
