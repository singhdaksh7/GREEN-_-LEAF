import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';

const FEATURED_LINKS = [
  { label: 'Best Sellers', to: '/collections/best-sellers' },
  { label: 'New Arrivals', to: '/collections/new-arrivals' },
  { label: 'Offers', to: '/collections/offers' },
  { label: 'Bulk Orders', to: '/bulk-orders' },
];

export function MegaMenu() {
  const { data: categories = [] } = useCategories();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <nav className="hidden border-t border-gray-100 bg-brand-50/40 lg:block">
      <div className="container-app">
        <ul className="flex items-center gap-0.5">
          {categories.map((category) => (
            <li
              key={category._id}
              className="relative"
              onMouseEnter={() => setOpenSlug(category.slug)}
              onMouseLeave={() => setOpenSlug(null)}
            >
              <Link
                to={`/collections/${category.slug}`}
                className={`block px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                  openSlug === category.slug ? 'text-brand-700' : 'text-gray-700 hover:text-brand-700'
                }`}
              >
                {category.name}
              </Link>

              {openSlug === category.slug && category.children && category.children.length > 0 && (
                <div className="absolute left-0 top-full z-30 pt-1">
                  <div className="grid grid-cols-1 gap-x-8 rounded-b-xl border border-gray-100 bg-white p-5 shadow-cardHover" style={{ minWidth: '260px' }}>
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{category.name}</p>
                      <div className="flex flex-col gap-0.5">
                        {category.children.map((child) => (
                          <Link
                            key={child._id}
                            to={`/collections/${child.slug}`}
                            className="rounded px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}

          <li className="relative" onMouseEnter={() => setOpenSlug('featured')} onMouseLeave={() => setOpenSlug(null)}>
            <span className="block cursor-pointer px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-accent-600">
              Featured
            </span>
            {openSlug === 'featured' && (
              <div className="absolute left-0 top-full z-30 pt-1">
                <div className="w-56 rounded-b-xl border border-gray-100 bg-white p-3 shadow-cardHover">
                  {FEATURED_LINKS.map((link) => (
                    <Link key={link.to} to={link.to} className="block rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
