import { Link } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';

export function NotFoundPage() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Seo title="Page Not Found" />
      <span className="text-6xl">🌵</span>
      <h1 className="mt-4 font-display text-3xl font-bold text-gray-900">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="mt-6 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
        Back to Home
      </Link>
    </div>
  );
}
