import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1),
  attributes: z.record(z.string()),
  mrp: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()).default([]),
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    shortDescription: z.string().min(1),
    description: z.string().min(1),
    howToUse: z.string().optional(),
    sku: z.string().min(1),
    brand: z.string().optional(),
    category: z.string().min(1),
    subcategory: z.string().nullable().optional(),
    images: z.array(z.string()).default([]),
    variants: z.array(variantSchema).default([]),
    mrp: z.number().nonnegative(),
    salePrice: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().optional(),
    bestSeller: z.boolean().optional(),
    newArrival: z.boolean().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    parent: z.string().nullable().optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const couponSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    type: z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING']),
    value: z.number().nonnegative(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().nonnegative().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const blogPostSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    category: z.enum(['Gardening Tips', 'Home Gardening', 'Plant Care', 'Fertilizers', 'DIY Gardening']),
    excerpt: z.string().min(1),
    content: z.string().min(1),
    coverImage: z.string().min(1),
    isPublished: z.boolean().optional(),
  }),
});

export const settingsSchema = z.object({
  body: z.object({
    announcementText: z.string().optional(),
    freeShippingThreshold: z.number().nonnegative().optional(),
    standardShippingFee: z.number().nonnegative().optional(),
    whatsappNumber: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    contactAddress: z.string().optional(),
    workingHours: z.string().optional(),
    socialLinks: z.object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});
