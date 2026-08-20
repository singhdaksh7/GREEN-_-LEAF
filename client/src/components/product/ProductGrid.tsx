import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) return <ProductGridSkeleton />;

  if (products.length === 0) {
    return <EmptyState icon="🌱" title="No products found" description="Try adjusting your filters or search terms." />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
