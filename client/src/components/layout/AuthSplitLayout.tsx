import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[80vh] grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 lg:block">
        <span className="absolute -left-8 top-16 text-[140px] opacity-10" aria-hidden>🌿</span>
        <span className="absolute -right-10 bottom-24 text-[180px] opacity-10" aria-hidden>🪴</span>
        <span className="absolute left-1/3 bottom-0 text-[120px] opacity-10" aria-hidden>🌱</span>
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link to="/" className="flex items-center gap-2">
            <img src="/leaf.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-xl font-bold">Green Leaf</span>
          </Link>
          <div>
            <p className="font-display text-2xl font-semibold leading-snug">
              Everything your garden needs, delivered across India.
            </p>
            <p className="mt-2 text-sm text-brand-100">Join thousands of home gardeners shopping with Green Leaf.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
