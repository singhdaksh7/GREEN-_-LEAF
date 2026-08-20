import { ReactNode } from 'react';
import { Seo } from '@/components/seo/Seo';

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-app max-w-3xl py-12">
      <Seo title={title} />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}
