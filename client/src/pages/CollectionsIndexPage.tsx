import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { Seo } from '@/components/seo/Seo';
import { Skeleton } from '@/components/ui/Skeleton';

export function CollectionsIndexPage() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="container-app py-8">
      <Seo title="All Collections" description="Browse all gardening collections at Green Leaf." />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">All Collections</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
          : categories.map((cat) => (
              <Link key={cat._id} to={`/collections/${cat.slug}`} className="group overflow-hidden rounded-xl border border-gray-100">
                <img src={cat.image} alt={cat.name} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                <div className="p-3 text-center text-sm font-medium text-gray-800">{cat.name}</div>
              </Link>
            ))}
      </div>
    </div>
  );
}
