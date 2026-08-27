import { Schema, model, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  key: 'default';
  announcementText: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  workingHours: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
  };
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: 'default', unique: true },
    announcementText: { type: String, default: 'Free Shipping on Orders Above ₹999' },
    freeShippingThreshold: { type: Number, default: 999 },
    standardShippingFee: { type: Number, default: 79 },
    whatsappNumber: { type: String, default: '919999999999' },
    contactEmail: { type: String, default: 'support@greenkart.example' },
    contactPhone: { type: String, default: '+91 99999 99999' },
    contactAddress: { type: String, default: 'Bengaluru, Karnataka, India' },
    workingHours: { type: String, default: 'Mon - Sat, 9:00 AM - 6:00 PM' },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      youtube: { type: String, default: 'https://youtube.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
    },
  },
  { timestamps: true }
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
