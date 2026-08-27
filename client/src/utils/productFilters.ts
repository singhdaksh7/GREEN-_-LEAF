import type { ProductListParams } from '@/api/products';

export interface CollectionFilters {
  minPrice: string;
  maxPrice: string;
  subcategory: string[];
  inStock: boolean;
  minRating: number;
  minDiscount: number;
  attributes: Record<string, string[]>;
}

export const emptyCollectionFilters = (): CollectionFilters => ({
  minPrice: '', maxPrice: '', subcategory: [], inStock: false, minRating: 0, minDiscount: 0, attributes: {},
});

export function filtersFromSearchParams(params: URLSearchParams): CollectionFilters {
  const attributes: Record<string, string[]> = {};
  params.forEach((value, key) => {
    if (key.startsWith('attr_') && value) attributes[key.slice(5)] = value.split(',').filter(Boolean);
  });
  return {
    minPrice: params.get('minPrice') ?? '', maxPrice: params.get('maxPrice') ?? '',
    subcategory: (params.get('subcategory') ?? '').split(',').filter(Boolean),
    inStock: params.get('inStock') === 'true', minRating: Number(params.get('minRating')) || 0,
    minDiscount: Number(params.get('minDiscount')) || 0, attributes,
  };
}

export function filtersToParams(filters: CollectionFilters): ProductListParams {
  return {
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    subcategory: filters.subcategory.join(',') || undefined, inStock: filters.inStock || undefined,
    minRating: filters.minRating || undefined, minDiscount: filters.minDiscount || undefined,
    attributes: filters.attributes,
  };
}

export function writeFilters(params: URLSearchParams, filters: CollectionFilters) {
  ['minPrice', 'maxPrice', 'subcategory', 'inStock', 'minRating', 'minDiscount'].forEach((key) => params.delete(key));
  Array.from(params.keys()).filter((key) => key.startsWith('attr_')).forEach((key) => params.delete(key));
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.subcategory.length) params.set('subcategory', filters.subcategory.join(','));
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.minRating) params.set('minRating', String(filters.minRating));
  if (filters.minDiscount) params.set('minDiscount', String(filters.minDiscount));
  Object.entries(filters.attributes).forEach(([key, values]) => { if (values.length) params.set(`attr_${key}`, values.join(',')); });
}

export function hasFilters(filters: CollectionFilters) {
  return Boolean(filters.minPrice || filters.maxPrice || filters.subcategory.length || filters.inStock || filters.minRating || filters.minDiscount || Object.values(filters.attributes).some((values) => values.length));
}
