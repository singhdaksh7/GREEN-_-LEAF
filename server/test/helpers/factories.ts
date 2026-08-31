import bcrypt from 'bcryptjs';
import { User, Category, Product, Coupon, UserRole } from '@prisma/client';
import { prisma } from '../../src/config/db';
import { signAccessToken } from '../../src/utils/jwt';

export async function createUser(overrides: Partial<{ role: UserRole; email: string }> = {}): Promise<User> {
  const passwordHash = await bcrypt.hash('Password@123', 4);
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash,
      role: overrides.role ?? 'CUSTOMER',
    },
  });
}

export function authHeaderFor(user: User): string {
  return `Bearer ${signAccessToken({ sub: user.id, role: user.role })}`;
}

export async function createCategory(overrides: Partial<{ name: string; slug: string }> = {}): Promise<Category> {
  return prisma.category.create({
    data: {
      name: overrides.name ?? 'Planters',
      slug: overrides.slug ?? `planters-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
  });
}

interface FactoryVariantInput {
  sku: string;
  attributes?: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images?: string[];
}

export async function createProduct(categoryId: string, overrides: Record<string, unknown> = {}): Promise<Product> {
  const { images, variants, tags, ...rest } = overrides as {
    images?: { url: string; key?: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[];
    variants?: FactoryVariantInput[];
    tags?: string[];
    [key: string]: unknown;
  };

  return prisma.product.create({
    data: {
      name: 'Ceramic Plant Pot',
      slug: `ceramic-plant-pot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      shortDescription: 'A lovely ceramic pot',
      description: 'A lovely ceramic pot for your favourite plant.',
      sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId,
      mrp: 500,
      salePrice: 400,
      stock: 10,
      status: 'PUBLISHED',
      images: { create: images ?? [{ url: 'pot.jpg', key: '', alt: '', isPrimary: true, sortOrder: 0 }] },
      tags: { create: (tags ?? []).map((tag) => ({ tag })) },
      variants: {
        create: (variants ?? []).map((v) => ({
          sku: v.sku,
          mrp: v.mrp,
          salePrice: v.salePrice,
          stock: v.stock,
          attributes: { create: Object.entries(v.attributes ?? {}).map(([key, value]) => ({ key, value })) },
          images: { create: (v.images ?? []).map((url, sortOrder) => ({ url, sortOrder })) },
        })),
      },
      ...rest,
    } as never,
  });
}

export async function createCoupon(overrides: Record<string, unknown> = {}): Promise<Coupon> {
  return prisma.coupon.create({
    data: {
      code: `SAVE10-${Date.now()}`,
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 0,
      isActive: true,
      ...overrides,
    } as never,
  });
}
