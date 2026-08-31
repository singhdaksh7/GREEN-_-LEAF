import { Prisma, Product, ProductStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { generateUniqueSlug } from '../utils/slug';
import * as categoryRepository from './category.repository';

const PRODUCT_INCLUDE = {
  category: true,
  subcategory: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: {
    include: {
      attributes: true,
      images: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  attributes: true,
  tags: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

interface ClientVariantInput {
  sku: string;
  attributes: Record<string, string>;
  mrp: number;
  salePrice: number;
  stock: number;
  images: string[];
}

interface ClientImageInput {
  url: string;
  key?: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ClientProductInput {
  name: string;
  shortDescription: string;
  description: string;
  howToUse?: string;
  sku: string;
  brand?: string;
  category: string;
  subcategory?: string | null;
  images?: ClientImageInput[];
  variants?: ClientVariantInput[];
  mrp: number;
  salePrice: number;
  stock: number;
  tags?: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  status?: ProductStatus;
}

/** Reshapes a Prisma product (with the include above) back to the exact flat
 * shape the API has always returned: `variants[].attributes` as a
 * Record<string,string> (not attribute rows), `variants[].images`/`tags` as
 * plain string arrays. Everything else (images, category, subcategory,
 * scalar fields) passes through unchanged — the id/_id duality and Decimal
 * conversion are handled once, globally, in ApiResponse.ts. */
export function toApiProduct(product: ProductWithRelations) {
  const { variants, tags, ...rest } = product;
  return {
    ...rest,
    // Derived from `status`, never stored — see the schema.prisma comment on
    // why `isActive` was intentionally not carried over as a persisted
    // column. Kept only for frontend/admin-UI backward compatibility.
    isActive: product.status === 'PUBLISHED',
    variants: variants.map((variant) => {
      const { attributes, images, ...variantRest } = variant;
      return {
        ...variantRest,
        attributes: Object.fromEntries(attributes.map((a) => [a.key, a.value])),
        images: images.map((i) => i.url),
      };
    }),
    tags: tags.map((t) => t.tag),
  };
}

function imageCreateInput(images: ClientImageInput[] = []) {
  return images.map((img) => ({
    url: img.url,
    key: img.key ?? '',
    alt: img.alt ?? '',
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  }));
}

function variantCreateInput(variants: ClientVariantInput[] = []) {
  return variants.map((v) => ({
    sku: v.sku,
    mrp: v.mrp,
    salePrice: v.salePrice,
    stock: v.stock,
    attributes: { create: Object.entries(v.attributes ?? {}).map(([key, value]) => ({ key, value })) },
    images: { create: (v.images ?? []).map((url, sortOrder) => ({ url, sortOrder })) },
  }));
}

function tagCreateInput(tags: string[] = []) {
  return tags.map((tag) => ({ tag }));
}

async function productSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return Boolean(existing);
}

export async function createProduct(input: ClientProductInput): Promise<ProductWithRelations> {
  const slug = await generateUniqueSlug(input.name, (s) => productSlugExists(s));

  return prisma.product.create({
    data: {
      name: input.name,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      howToUse: input.howToUse,
      sku: input.sku,
      brand: input.brand ?? 'GreenKart',
      category: { connect: { id: input.category } },
      subcategory: input.subcategory ? { connect: { id: input.subcategory } } : undefined,
      mrp: input.mrp,
      salePrice: input.salePrice,
      stock: input.stock,
      featured: input.featured ?? false,
      bestSeller: input.bestSeller ?? false,
      newArrival: input.newArrival ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status ?? 'DRAFT',
      images: { create: imageCreateInput(input.images) },
      variants: { create: variantCreateInput(input.variants) },
      tags: { create: tagCreateInput(input.tags) },
    },
    include: PRODUCT_INCLUDE,
  });
}

export function findProductById(id: string): Promise<ProductWithRelations | null> {
  return prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
}

export function findProductBySlug(slug: string, publicOnly = true): Promise<ProductWithRelations | null> {
  return prisma.product.findFirst({
    where: { slug, ...(publicOnly ? { status: 'PUBLISHED' } : {}) },
    include: PRODUCT_INCLUDE,
  });
}

export async function updateProduct(id: string, input: Partial<ClientProductInput>): Promise<ProductWithRelations | null> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name;
    if (input.name !== existing.name) {
      data.slug = await generateUniqueSlug(input.name, (s) => productSlugExists(s, id));
    }
  }
  if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription;
  if (input.description !== undefined) data.description = input.description;
  if (input.howToUse !== undefined) data.howToUse = input.howToUse;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.category !== undefined) data.category = { connect: { id: input.category } };
  if (input.subcategory !== undefined) {
    data.subcategory = input.subcategory ? { connect: { id: input.subcategory } } : { disconnect: true };
  }
  if (input.mrp !== undefined) data.mrp = input.mrp;
  if (input.salePrice !== undefined) data.salePrice = input.salePrice;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.bestSeller !== undefined) data.bestSeller = input.bestSeller;
  if (input.newArrival !== undefined) data.newArrival = input.newArrival;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
  if (input.status !== undefined) data.status = input.status;

  // Full-replace semantics for these collections, matching the Mongoose
  // embedded-array behavior exactly: when the admin form sends `images`,
  // `variants`, or `tags`, that array is the new complete state, not a
  // patch. Cascading FKs (onDelete: Cascade on VariantAttribute/VariantImage)
  // clean up old variant children automatically when old variants are
  // deleted here.
  if (input.images !== undefined) {
    data.images = { deleteMany: {}, create: imageCreateInput(input.images) };
  }
  if (input.variants !== undefined) {
    data.variants = { deleteMany: {}, create: variantCreateInput(input.variants) };
  }
  if (input.tags !== undefined) {
    data.tags = { deleteMany: {}, create: tagCreateInput(input.tags) };
  }

  return prisma.product.update({ where: { id }, data, include: PRODUCT_INCLUDE });
}

export function archiveProduct(id: string): Promise<Product | null> {
  return prisma.product
    .update({ where: { id }, data: { status: 'ARCHIVED' } })
    .catch(() => null as unknown as Product);
}

// ---------------------------------------------------------------------------
// Admin listing
// ---------------------------------------------------------------------------

export interface AdminProductListOptions {
  q?: string;
  category?: string;
  status?: ProductStatus;
  page: number;
  limit: number;
}

export async function listAdminProducts(options: AdminProductListOptions) {
  const where: Prisma.ProductWhereInput = {
    ...(options.q ? { name: { contains: options.q } } : {}),
    ...(options.category ? { categoryId: options.category } : {}),
    ...(options.status ? { status: options.status } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

// ---------------------------------------------------------------------------
// Public storefront listing / filtering
// ---------------------------------------------------------------------------

export interface PublicProductQuery {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  minDiscount?: number;
  brand?: string;
  attributes?: Record<string, string[]>;
  tag?: string;
  q?: string;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: 'desc' }, { createdAt: 'desc' }],
  'best-selling': [{ bestSeller: 'desc' }, { reviewCount: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ salePrice: 'asc' }],
  'price-desc': [{ salePrice: 'desc' }],
  'rating-desc': [{ averageRating: 'desc' }],
  // 'discount-desc' is handled specially — discountPercent isn't a stored
  // column, see below.
};

async function buildBaseWhere(query: PublicProductQuery): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = { status: 'PUBLISHED' };

  if (query.category) {
    const category = await categoryRepository.findCategoryBySlug(query.category);
    where.categoryId = category ? category.id : '__no_match__';
  }

  if (query.subcategory) {
    const slugs = query.subcategory.split(',').filter(Boolean);
    const subcategories = await categoryRepository.findCategoriesBySlugs(slugs);
    where.subcategoryId = { in: subcategories.map((c) => c.id) };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.salePrice = {};
    if (query.minPrice !== undefined) where.salePrice.gte = query.minPrice;
    if (query.maxPrice !== undefined) where.salePrice.lte = query.maxPrice;
  }

  if (query.inStock) {
    where.OR = [{ stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 } } } }];
  }
  if (query.minRating !== undefined) where.averageRating = { gte: query.minRating };
  if (query.brand) where.brand = query.brand;
  if (query.tag) where.tags = { some: { tag: query.tag } };
  if (query.featured) where.featured = true;
  if (query.bestSeller) where.bestSeller = true;
  if (query.newArrival) where.newArrival = true;

  if (query.q) {
    where.OR = [
      ...(where.OR ?? []),
      { name: { contains: query.q } },
      { description: { contains: query.q } },
      { brand: { contains: query.q } },
      { tags: { some: { tag: { contains: query.q } } } },
    ];
  }

  if (query.attributes) {
    const groups = Object.entries(query.attributes).filter(([, values]) => values.length > 0);
    if (groups.length) {
      where.AND = groups.map(([key, values]) => ({
        OR: [
          { variants: { some: { attributes: { some: { key, value: { in: values } } } } } },
          { attributes: { some: { key, value: { in: values } } } },
        ],
      }));
    }
  }

  return where;
}

function discountPercentOf(product: { mrp: unknown; salePrice: unknown }): number {
  const mrp = Number(product.mrp);
  const salePrice = Number(product.salePrice);
  return mrp > 0 ? ((mrp - salePrice) / mrp) * 100 : 0;
}

export async function listPublicProducts(query: PublicProductQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(60, Math.max(1, query.limit ?? 20));
  const where = await buildBaseWhere(query);
  const sortKey = query.sort ?? 'featured';

  let products: ProductWithRelations[];
  let totalProducts: number;

  if (query.minDiscount !== undefined || sortKey === 'discount-desc') {
    // discountPercent isn't a stored column, so this path (relatively rare —
    // discount filtering/sorting specifically) fetches every matching row
    // and does the discount computation/filter/sort in application code.
    // Fine at this catalogue's scale; documented as a deliberate simplicity
    // trade-off rather than adding a raw-SQL computed-column query.
    const all = await prisma.product.findMany({ where, include: PRODUCT_INCLUDE });
    let filtered = all;
    if (query.minDiscount !== undefined) {
      filtered = filtered.filter((p) => discountPercentOf(p) >= query.minDiscount!);
    }
    filtered = filtered.slice().sort((a, b) => {
      if (sortKey === 'discount-desc') return discountPercentOf(b) - discountPercentOf(a);
      return 0;
    });
    if (sortKey !== 'discount-desc') {
      // Still respect a non-discount sort if minDiscount was combined with it.
      filtered = applyInMemorySort(filtered, sortKey);
    }
    totalProducts = filtered.length;
    products = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
  } else {
    const orderBy = SORT_MAP[sortKey] ?? SORT_MAP.featured;
    [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
  }

  const [variantAttributeFacets, productAttributeFacets, subcategories] = await Promise.all([
    prisma.variantAttribute.findMany({
      where: { variant: { product: where } },
      select: { key: true, value: true },
      distinct: ['key', 'value'],
    }),
    prisma.productAttribute.findMany({
      where: { product: where },
      select: { key: true, value: true },
      distinct: ['key', 'value'],
    }),
    where.categoryId && typeof where.categoryId === 'string'
      ? categoryRepository.findChildCategories(where.categoryId)
      : Promise.resolve([]),
  ]);

  const attributeMap: Record<string, Set<string>> = {};
  for (const row of [...variantAttributeFacets, ...productAttributeFacets]) {
    (attributeMap[row.key] ??= new Set()).add(row.value);
  }

  return {
    products: products.map(toApiProduct),
    page,
    limit,
    totalProducts,
    totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
    filterOptions: {
      subcategories: subcategories.map((c) => ({ name: c.name, slug: c.slug })),
      attributes: Object.fromEntries(Object.entries(attributeMap).map(([k, v]) => [k, [...v].sort()])),
    },
  };
}

function applyInMemorySort(products: ProductWithRelations[], sortKey: string): ProductWithRelations[] {
  const comparators: Record<string, (a: ProductWithRelations, b: ProductWithRelations) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.getTime() - a.createdAt.getTime(),
    'best-selling': (a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.reviewCount - a.reviewCount,
    newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    'price-asc': (a, b) => Number(a.salePrice) - Number(b.salePrice),
    'price-desc': (a, b) => Number(b.salePrice) - Number(a.salePrice),
    'rating-desc': (a, b) => b.averageRating - a.averageRating,
  };
  const cmp = comparators[sortKey] ?? comparators.featured;
  return products.slice().sort(cmp);
}

export function suggestProducts(q: string, limit = 6) {
  return prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ name: { contains: q } }, { brand: { contains: q } }, { tags: { some: { tag: { contains: q } } } }],
    },
    select: {
      name: true,
      slug: true,
      salePrice: true,
      mrp: true,
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
    take: limit,
  });
}

export async function getRelatedProducts(product: Pick<Product, 'id' | 'categoryId'>, limit = 8) {
  const related = await prisma.product.findMany({
    where: { id: { not: product.id }, categoryId: product.categoryId, status: 'PUBLISHED' },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return related.map(toApiProduct);
}
