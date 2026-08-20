import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, ProductListParams } from '@/api/products';
import { ProductGrid } from '@/components/product/ProductGrid';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  viewAllTo: string;
  params: ProductListParams;
}

export function ProductSection({ title, subtitle, viewAllTo, params }: ProductSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['home-products', params],
    queryFn: () => fetchProducts({ limit: 10, ...params }),
  });

  return (
    <section className="container-app py-7 sm:py-9">
      <div className="mb-4 flex items-end justify-between sm:mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{subtitle}</p>}
        </div>
        <Link to={viewAllTo} className="focus-ring flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-brand-700 hover:underline sm:text-sm">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <ProductGrid products={data?.products ?? []} isLoading={isLoading} />
    </section>
  );
}
