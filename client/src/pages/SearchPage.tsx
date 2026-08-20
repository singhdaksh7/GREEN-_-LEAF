import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchProducts } from '@/api/search';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { SortDropdown } from '@/components/product/SortDropdown';
import { Seo } from '@/components/seo/Seo';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') ?? 'featured';

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, page, sort],
    queryFn: () => searchProducts(q, page, sort),
    enabled: q.trim().length > 0,
  });

  function updateParams(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setSearchParams(next);
  }

  return (
    <div className="container-app py-8">
      <Seo title={`Search results for "${q}"`} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Search results for &quot;{q}&quot;</h1>
          <p className="mt-1 text-sm text-gray-500">{data?.totalProducts ?? 0} products found</p>
        </div>
        <SortDropdown value={sort} onChange={(v) => updateParams({ sort: v })} />
      </div>

      {!q.trim() ? (
        <p className="text-sm text-gray-500">Start typing in the search bar to find gardening products.</p>
      ) : (
        <>
          <ProductGrid products={data?.products ?? []} isLoading={isLoading} />
          {data && data.totalProducts === 0 && (
            <p className="mt-4 text-center text-sm text-gray-500">No products found for your search.</p>
          )}
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={(p) => updateParams({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
