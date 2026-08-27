import { useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import { fetchProducts } from '@/api/products';
import { fetchCategoryBySlug } from '@/api/categories';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters } from '@/components/product/ProductFilters';
import { SortDropdown } from '@/components/product/SortDropdown';
import { Pagination } from '@/components/ui/Pagination';
import { Seo } from '@/components/seo/Seo';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEscapeClose } from '@/hooks/useEscapeClose';
import { CollectionFilters, emptyCollectionFilters, filtersFromSearchParams, filtersToParams, hasFilters, writeFilters } from '@/utils/productFilters';

const VIRTUAL_COLLECTIONS: Record<string, { title: string; description: string; params: Record<string, boolean> }> = {
  'best-sellers': { title: 'Best Sellers', description: 'Our most loved gardening products.', params: { bestSeller: true } },
  'new-arrivals': { title: 'New Arrivals', description: 'Freshly added to our catalogue.', params: { newArrival: true } },
  offers: { title: 'Offers', description: 'Great gardening deals, curated for you.', params: {} },
};

export function CollectionPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isVirtual = slug in VIRTUAL_COLLECTIONS;
  const virtual = VIRTUAL_COLLECTIONS[slug];
  const { data: category, isLoading: categoryLoading, isError: categoryError } = useQuery({ queryKey: ['category', slug], queryFn: () => fetchCategoryBySlug(slug), enabled: !isVirtual, retry: false });
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') ?? 'featured';
  const queryParams = useMemo(() => ({ category: isVirtual ? undefined : slug, page, sort, ...filtersToParams(filters), ...(isVirtual ? virtual.params : {}) }), [filters, isVirtual, page, slug, sort, virtual]);
  const { data, isLoading } = useQuery({ queryKey: ['collection-products', queryParams], queryFn: () => fetchProducts(queryParams), enabled: isVirtual || Boolean(category) });
  const updateFilters = (nextFilters: CollectionFilters) => { const next = new URLSearchParams(searchParams); writeFilters(next, nextFilters); next.delete('page'); setSearchParams(next); };
  const clearFilters = () => updateFilters(emptyCollectionFilters());
  const updateParam = (key: string, value: string | number) => { const next = new URLSearchParams(searchParams); if (value) next.set(key, String(value)); else next.delete(key); if (key !== 'page') next.delete('page'); setSearchParams(next); };
  const title = isVirtual ? virtual.title : category?.name ?? 'Collection';
  const description = isVirtual ? virtual.description : category?.description;
  useEscapeClose(drawerOpen, () => setDrawerOpen(false));
  if (!isVirtual && !categoryLoading && (categoryError || !category)) return <div className="container-app py-8"><Seo title="Collection Not Found" /><EmptyState icon="🔍" title="This collection doesn't exist" actionLabel="Browse All Collections" actionTo="/collections" /></div>;
  const chips = [
    filters.minPrice || filters.maxPrice ? { label: `Price: ₹${filters.minPrice || '0'}–₹${filters.maxPrice || '∞'}`, clear: () => updateFilters({ ...filters, minPrice: '', maxPrice: '' }) } : null,
    filters.inStock ? { label: 'In stock', clear: () => updateFilters({ ...filters, inStock: false }) } : null,
    filters.minRating ? { label: `${filters.minRating}★ & above`, clear: () => updateFilters({ ...filters, minRating: 0 }) } : null,
    filters.minDiscount ? { label: `${filters.minDiscount}%+ off`, clear: () => updateFilters({ ...filters, minDiscount: 0 }) } : null,
    ...filters.subcategory.map((value) => ({ label: data?.filterOptions?.subcategories.find((item) => item.slug === value)?.name ?? value, clear: () => updateFilters({ ...filters, subcategory: filters.subcategory.filter((item) => item !== value) }) })),
    ...Object.entries(filters.attributes).flatMap(([key, values]) => values.map((value) => ({ label: value, clear: () => updateFilters({ ...filters, attributes: { ...filters.attributes, [key]: values.filter((item) => item !== value) } }) }))),
  ].filter(Boolean) as { label: string; clear: () => void }[];
  const filterPanel = <ProductFilters filters={filters} options={data?.filterOptions} onChange={updateFilters} onClear={clearFilters} />;
  return <div className="container-app py-5 sm:py-8"><Seo title={title} description={description} /><nav className="mb-3 text-xs text-gray-500"><Link to="/">Home</Link> <span className="mx-1">/</span> {title}</nav><div className="mb-4"><h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>{description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}</div><div className="mb-4 flex items-center justify-between gap-3 lg:hidden"><button onClick={() => setDrawerOpen(true)} className="focus-ring flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium"><SlidersHorizontal size={16} /> Filter{hasFilters(filters) ? ` (${chips.length})` : ''}</button><SortDropdown value={sort} onChange={(value) => updateParam('sort', value)} /></div><div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]"><aside className="hidden lg:block">{filterPanel}</aside><main><div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3"><p className="text-sm text-gray-500">Showing {data?.totalProducts ?? 0} products</p><div className="hidden lg:block"><SortDropdown value={sort} onChange={(value) => updateParam('sort', value)} /></div></div>{chips.length ? <div className="mb-4 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip.label} onClick={chip.clear} className="focus-ring rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-800">{chip.label} ×</button>)}<button onClick={clearFilters} className="focus-ring text-xs font-medium text-brand-700">Clear all</button></div> : null}<ProductGrid products={data?.products ?? []} isLoading={isLoading} />{!isLoading && data?.totalProducts === 0 ? <EmptyState title="No products match these filters." actionLabel="Clear Filters" actionTo={`/collections/${slug}`} /> : null}<Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={(value) => updateParam('page', value)} /></main></div>{drawerOpen ? <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters"><div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} /><div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white"><div className="flex items-center justify-between border-b p-4"><h2 className="font-semibold">Filters</h2><button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="focus-ring rounded p-1"><X size={20} /></button></div><div className="flex-1 overflow-y-auto p-4">{filterPanel}</div><div className="flex gap-3 border-t p-4"><button onClick={clearFilters} className="focus-ring flex-1 rounded-lg border py-2.5 text-sm">Clear all</button><button onClick={() => setDrawerOpen(false)} className="focus-ring flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white">Apply filters</button></div></div></div> : null}</div>;
}
