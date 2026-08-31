import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1),
  attributes: z.record(z.string()),
  mrp: z.number().nonnegative(),
  salePrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()).default([]),
}).strict();

const productImageSchema = z.object({
  url: z.string().min(1),
  key: z.string().default(''),
  alt: z.string().optional().default(''),
  isPrimary: z.boolean(),
  sortOrder: z.number().int(),
}).strict();

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
    images: z.array(productImageSchema).default([]),
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
    // Publish state; not `isActive` directly — that flag is now derived
    // server-side from `status` (see Product model) to avoid two sources
    // of truth for the same visibility concept.
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  }).strict(),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().optional(),
    parent: z.string().nullable().optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
  }).strict(),
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
  }).strict(),
});

export const blogPostSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    category: z.enum(['Gardening Tips', 'Home Gardening', 'Plant Care', 'Fertilizers', 'DIY Gardening']),
    excerpt: z.string().min(1),
    content: z.string().min(1),
    coverImage: z.string().min(1),
    isPublished: z.boolean().optional(),
  }).strict(),
});

// --- Update (PATCH) schemas -------------------------------------------------
// These intentionally mirror the create schemas but make every field
// optional so a partial edit cannot accidentally wipe fields (e.g. variants,
// tags) that were simply left out of the request body. `.strict()` rejects
// any unknown/extra keys instead of silently ignoring them, and immutable
// fields (slug, usedCount, author, etc.) are never included so they cannot
// be overwritten via PATCH regardless of what the client sends.

export const productUpdateSchema = z.object({
  body: productSchema.shape.body.partial().strict(),
});

export const categoryUpdateSchema = z.object({
  body: categorySchema.shape.body.partial().strict(),
});

export const couponUpdateSchema = z.object({
  body: couponSchema.shape.body.partial().strict(),
});

export const blogPostUpdateSchema = z.object({
  body: blogPostSchema.shape.body.partial().strict(),
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
    }).strict().optional(),
  }).strict(),
});
