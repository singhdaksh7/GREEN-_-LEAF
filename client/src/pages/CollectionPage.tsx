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

const VIRTUAL_COLLECTIONS: Record<string, { title: string; description: string; params: Record<string, boolean> }> = {
  'best-sellers': { title: 'Best Sellers', description: 'Our most loved gardening products.', params: { bestSeller: true } },
  'new-arrivals': { title: 'New Arrivals', description: 'Freshly added to our catalogue.', params: { newArrival: true } },
  offers: { title: 'Offers', description: 'Great gardening deals, curated for you.', params: {} },
};

export function CollectionPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isVirtual = slug in VIRTUAL_COLLECTIONS;
  const virtual = VIRTUAL_COLLECTIONS[slug];

  const { data: category, isLoading: isCategoryLoading, isError: isCategoryError } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !isVirtual,
    retry: false,
  });

  const categoryNotFound = !isVirtual && !isCategoryLoading && (isCategoryError || !category);

  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') ?? 'featured';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const minRating = Number(searchParams.get('minRating')) || 0;
  const minDiscount = Number(searchParams.get('minDiscount')) || (slug === 'offers' ? 10 : 0);

  const queryParams = useMemo(
    () => ({
      category: isVirtual ? undefined : slug,
      page,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: inStockOnly,
      minRating: minRating || undefined,
      minDiscount: minDiscount || undefined,
      ...(isVirtual ? virtual.params : {}),
    }),
    [isVirtual, slug, page, sort, minPrice, maxPrice, inStockOnly, minRating, minDiscount, virtual]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['collection-products', queryParams],
    queryFn: () => fetchProducts(queryParams),
    enabled: isVirtual || Boolean(category),
  });

  function updateParams(patch: Record<string, string | boolean | number | undefined>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === false || value === 0) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    next.delete('page');
    setSearchParams(next);
  }

  function handleFilterChange(patch: { minPrice?: string; maxPrice?: string; inStockOnly?: boolean; minRating?: number; minDiscount?: number }) {
    updateParams({
      minPrice: patch.minPrice,
      maxPrice: patch.maxPrice,
      inStock: patch.inStockOnly,
      minRating: patch.minRating,
      minDiscount: patch.minDiscount,
    });
  }

  const title = isVirtual ? virtual.title : category?.name ?? 'Collection';
  const description = isVirtual ? virtual.description : category?.description;
  const activeFilterCount = [minPrice, maxPrice, inStockOnly, minRating, minDiscount].filter(Boolean).length;

  useEscapeClose(isFilterDrawerOpen, () => setIsFilterDrawerOpen(false));

  if (categoryNotFound) {
    return (
      <div className="container-app py-5 sm:py-8">
        <Seo title="Collection Not Found" />
        <nav className="mb-3 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-700">Home</Link> <span className="mx-1">/</span> <span className="text-gray-700">Not Found</span>
        </nav>
        <EmptyState
          icon="🔍"
          title="This collection doesn't exist"
          description="The category you're looking for may have been moved or renamed."
          actionLabel="Browse All Collections"
          actionTo="/collections"
        />
      </div>
    );
  }

  return (
    <div className="container-app py-5 sm:py-8">
      <Seo title={title} description={description} />

      <nav className="mb-3 text-xs text-gray-500">
        <Link to="/" className="hover:text-brand-700">Home</Link> <span className="mx-1">/</span> <span className="text-gray-700">{title}</span>
      </nav>

      <div className="mb-4 flex items-end justify-between sm:mb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-xl text-xs text-gray-500 sm:text-sm">{description}</p>}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className="focus-ring flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
        >
          <SlidersHorizontal size={16} /> Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <SortDropdown value={sort} onChange={(v) => updateParams({ sort: v })} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            inStockOnly={inStockOnly}
            minRating={minRating}
            minDiscount={minDiscount}
            onChange={handleFilterChange}
            onClear={() => setSearchParams({})}
          />
        </aside>

        <div>
          <div className="mb-4 hidden items-center justify-between border-b border-gray-100 pb-3 lg:flex">
            <p className="text-sm text-gray-500">{data?.totalProducts ?? 0} Products</p>
            <SortDropdown value={sort} onChange={(v) => updateParams({ sort: v })} />
          </div>
          <p className="mb-3 text-xs text-gray-400 lg:hidden">{data?.totalProducts ?? 0} products</p>
          <ProductGrid products={data?.products ?? []} isLoading={isLoading} />
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={(p) => updateParams({ page: p })} />
        </div>
      </div>

      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="text-base font-semibold">Filters</h2>
              <button onClick={() => setIsFilterDrawerOpen(false)} aria-label="Close filters" className="focus-ring rounded p-1 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ProductFilters
                minPrice={minPrice}
                maxPrice={maxPrice}
                inStockOnly={inStockOnly}
                minRating={minRating}
                minDiscount={minDiscount}
                onChange={handleFilterChange}
                onClear={() => setSearchParams({})}
              />
            </div>
            <div className="flex gap-3 border-t border-gray-100 p-4">
              <button
                onClick={() => setSearchParams({})}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white"
              >
                Show {data?.totalProducts ?? 0} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
