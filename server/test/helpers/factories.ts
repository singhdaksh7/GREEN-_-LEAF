import bcrypt from 'bcryptjs';
import { User, IUser } from '../../src/models/User';
import { Category } from '../../src/models/Category';
import { Product } from '../../src/models/Product';
import { Coupon } from '../../src/models/Coupon';
import { signAccessToken } from '../../src/utils/jwt';

export async function createUser(overrides: Partial<{ role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'; email: string }> = {}): Promise<IUser> {
  const passwordHash = await bcrypt.hash('Password@123', 4);
  return User.create({
    name: 'Test User',
    email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    passwordHash,
    role: overrides.role ?? 'CUSTOMER',
  });
}

export function authHeaderFor(user: IUser): string {
  return `Bearer ${signAccessToken({ sub: user.id, role: user.role })}`;
}

export async function createCategory(overrides: Partial<{ name: string; slug: string }> = {}) {
  return Category.create({
    name: overrides.name ?? 'Planters',
    slug: overrides.slug ?? 'planters',
  });
}

export async function createProduct(categoryId: string, overrides: Record<string, unknown> = {}) {
  return Product.create({
    name: 'Ceramic Plant Pot',
    slug: `ceramic-plant-pot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    shortDescription: 'A lovely ceramic pot',
    description: 'A lovely ceramic pot for your favourite plant.',
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category: categoryId,
    images: [{ url: 'pot.jpg', key: '', alt: '', isPrimary: true, sortOrder: 0 }],
    mrp: 500,
    salePrice: 400,
    stock: 10,
    status: 'PUBLISHED',
    ...overrides,
  });
}

export async function createCoupon(overrides: Record<string, unknown> = {}) {
  return Coupon.create({
    code: `SAVE10-${Date.now()}`,
    type: 'PERCENTAGE',
    value: 10,
    minOrderValue: 0,
    isActive: true,
    ...overrides,
  });
}
