import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPost } from '@/api/blog';
import { Seo } from '@/components/seo/Seo';
import { formatDate } from '@/utils/format';

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const { data: post, isLoading } = useQuery({ queryKey: ['blog-post', slug], queryFn: () => fetchBlogPost(slug) });

  if (isLoading || !post) {
    return <div className="container-app py-10"><div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" /></div>;
  }

  return (
    <article className="container-app max-w-3xl py-10">
      <Seo title={post.title} description={post.excerpt} jsonLd={{ '@context': 'https://schema.org', '@type': 'Article', headline: post.title, image: post.coverImage, datePublished: post.publishedAt }} />
      <nav className="mb-4 text-xs text-gray-500">
        <Link to="/blog">Blog</Link> <span className="mx-1">/</span> <span className="text-gray-700">{post.title}</span>
      </nav>
      <span className="text-xs font-medium text-brand-600">{post.category}</span>
      <h1 className="mt-1 font-display text-3xl font-bold text-gray-900">{post.title}</h1>
      <p className="mt-2 text-xs text-gray-400">{formatDate(post.publishedAt)}</p>
      <img src={post.coverImage} alt={post.title} className="mt-6 aspect-video w-full rounded-xl object-cover" />
      <div className="mt-6 max-w-none whitespace-pre-line text-sm leading-relaxed text-gray-700">{post.content}</div>
    </article>
  );
}
