import { FilterQuery, PipelineStage } from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { Category } from '../models/Category';

export interface ProductQuery {
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

const sortMap: Record<string, Record<string, 1 | -1>> = {
  featured: { featured: -1, createdAt: -1 },
  'best-selling': { bestSeller: -1, reviewCount: -1 },
  newest: { createdAt: -1 },
  'price-asc': { salePrice: 1 },
  'price-desc': { salePrice: -1 },
  'rating-desc': { averageRating: -1 },
  'discount-desc': { discountPercent: -1 },
};

export async function listProducts(query: ProductQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(60, Math.max(1, query.limit ?? 20));
  const filter: FilterQuery<IProduct> = { isActive: true };

  if (query.category) {
    const category = await Category.findOne({ slug: query.category });
    if (category) filter.category = category._id;
    else filter.category = null; // no match
  }

  if (query.subcategory) {
    const slugs = query.subcategory.split(',').filter(Boolean);
    const subcategories = await Category.find({ slug: { $in: slugs }, isActive: true }).select('_id');
    filter.subcategory = { $in: subcategories.map((category) => category._id) };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.salePrice = {};
    if (query.minPrice !== undefined) filter.salePrice.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.salePrice.$lte = query.maxPrice;
  }

  if (query.inStock) filter.$or = [{ stock: { $gt: 0 } }, { 'variants.stock': { $gt: 0 } }];
  if (query.minRating !== undefined) filter.averageRating = { $gte: query.minRating };
  if (query.brand) filter.brand = query.brand;
  if (query.tag) filter.tags = query.tag;
  if (query.featured) filter.featured = true;
  if (query.bestSeller) filter.bestSeller = true;
  if (query.newArrival) filter.newArrival = true;
  if (query.q) filter.$text = { $search: query.q };
  if (query.attributes) {
    const attributeGroups = Object.entries(query.attributes)
      .filter(([, values]) => values.length)
      .map(([key, values]) => ({ variants: { $elemMatch: { [`attributes.${key}`]: { $in: values } } } }));
    if (attributeGroups.length) filter.$and = attributeGroups;
  }

  const pipeline: PipelineStage[] = [
    { $match: filter },
    {
      $addFields: {
        discountPercent: {
          $cond: [
            { $gt: ['$mrp', 0] },
            { $multiply: [{ $divide: [{ $subtract: ['$mrp', '$salePrice'] }, '$mrp'] }, 100] },
            0,
          ],
        },
      },
    },
  ];

  if (query.minDiscount !== undefined) {
    pipeline.push({ $match: { discountPercent: { $gte: query.minDiscount } } });
  }

  const sortStage = sortMap[query.sort ?? 'featured'] ?? sortMap.featured;
  pipeline.push({ $sort: sortStage });

  const countPipeline = [...pipeline, { $count: 'total' }];
  pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

  const [products, countResult] = await Promise.all([
    Product.aggregate(pipeline),
    Product.aggregate(countPipeline),
  ]);

  const totalProducts = countResult[0]?.total ?? 0;

  const facetFilter: FilterQuery<IProduct> = { ...filter };
  delete facetFilter.variants;
  const [facetRows, subcategories] = await Promise.all([
    Product.aggregate<{ variants: { attributes?: Record<string, string> }[] }>([{ $match: facetFilter }, { $project: { variants: 1 } }]),
    filter.category ? Category.find({ parent: filter.category, isActive: true }).select('name slug').sort({ order: 1, name: 1 }).lean() : [],
  ]);
  const attributes: Record<string, Set<string>> = {};
  facetRows.forEach((product) => product.variants.forEach((variant) => Object.entries(variant.attributes ?? {}).forEach(([key, value]) => {
    if (!attributes[key]) attributes[key] = new Set();
    attributes[key].add(value);
  })));

  return {
    products,
    page,
    limit,
    totalProducts,
    totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
    filterOptions: { subcategories, attributes: Object.fromEntries(Object.entries(attributes).map(([key, values]) => [key, [...values].sort()])) },
  };
}

export async function getProductBySlug(slug: string): Promise<IProduct | null> {
  return Product.findOne({ slug, isActive: true }).populate('category', 'name slug').populate('subcategory', 'name slug');
}

export async function getRelatedProducts(product: IProduct, limit = 8) {
  return Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(limit)
    .lean();
}
