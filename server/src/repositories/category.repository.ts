import { Category, Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { generateUniqueSlug } from '../utils/slug';

export function listActiveCategories(): Promise<Category[]> {
  return prisma.category.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] });
}

export function listAllCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
}

export function findCategoryBySlug(slug: string): Promise<Category | null> {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export function findChildCategories(parentId: string, activeOnly = true): Promise<Category[]> {
  return prisma.category.findMany({
    where: { parentId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { order: 'asc' },
  });
}

export function findCategoriesBySlugs(slugs: string[]): Promise<Category[]> {
  return prisma.category.findMany({ where: { slug: { in: slugs }, isActive: true } });
}

export function findCategoryById(id: string): Promise<Category | null> {
  return prisma.category.findUnique({ where: { id } });
}

async function categorySlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.category.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return Boolean(existing);
}

export async function createCategory(data: Omit<Prisma.CategoryCreateInput, 'slug'>, name: string): Promise<Category> {
  const slug = await generateUniqueSlug(name, (s) => categorySlugExists(s));
  return prisma.category.create({ data: { ...data, slug } });
}

export async function updateCategory(id: string, data: Prisma.CategoryUpdateInput & { name?: string }): Promise<Category | null> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return null;

  const update: Prisma.CategoryUpdateInput = { ...data };
  if (typeof data.name === 'string' && data.name !== existing.name) {
    update.slug = await generateUniqueSlug(data.name, (s) => categorySlugExists(s, id));
  }

  return prisma.category.update({ where: { id }, data: update });
}

export function deactivateCategory(id: string): Promise<Category> {
  return prisma.category.update({ where: { id }, data: { isActive: false } });
}
