import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPosts } from '@/api/blog';
import { Seo } from '@/components/seo/Seo';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';

const CATEGORIES = ['Gardening Tips', 'Home Gardening', 'Plant Care', 'Fertilizers', 'DIY Gardening'];

export function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const category = searchParams.get('category') ?? undefined;

  const { data, isLoading } = useQuery({ queryKey: ['blog', page, category], queryFn: () => fetchBlogPosts(page, category) });

  return (
    <div className="container-app py-8">
      <Seo title="Gardening Blog" description="Tips and guides for home gardening in India." />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Gardening Blog</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSearchParams({})}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!category ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSearchParams({ category: cat })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${category === cat ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.posts.map((post) => (
            <Link key={post._id} to={`/blog/${post.slug}`} className="group overflow-hidden rounded-xl border border-gray-100">
              <img src={post.coverImage} alt={post.title} className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
              <div className="p-4">
                <span className="text-xs font-medium text-brand-600">{post.category}</span>
                <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800">{post.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{post.excerpt}</p>
                <p className="mt-2 text-xs text-gray-400">{formatDate(post.publishedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={(p) => setSearchParams({ page: String(p), ...(category ? { category } : {}) })} />
    </div>
  );
}
