import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Heart, MessageCircle, Package, ShoppingBag, User, X } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettings } from '@/hooks/useSettings';
import { useEscapeClose } from '@/hooks/useEscapeClose';
import { SearchBar } from './SearchBar';

export function MobileNav() {
  const isOpen = useUiStore((s) => s.isMobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const { data: categories = [] } = useCategories();
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEscapeClose(isOpen, () => toggle(false));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => toggle(false)} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <span className="flex items-center gap-1.5">
            <img src="/brand/greenkart-icon.webp" alt="" className="h-6 w-6 object-contain" />
            <span className="font-display text-lg font-semibold text-brand-700">GreenKart</span>
          </span>
          <button onClick={() => toggle(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <div className="p-4">
          <SearchBar />
        </div>

        <div className="flex flex-col gap-0.5 border-b border-gray-100 px-3 pb-3">
          <Link to={user ? '/account' : '/login'} onClick={() => toggle(false)} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm font-medium text-gray-700 active:bg-gray-50">
            <User size={18} /> {user ? `Hi, ${user.name}` : 'Login / Register'}
          </Link>
          <Link to="/account/wishlist" onClick={() => toggle(false)} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-gray-700 active:bg-gray-50">
            <Heart size={18} /> Wishlist
          </Link>
          <Link to="/track-order" onClick={() => toggle(false)} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-gray-700 active:bg-gray-50">
            <Package size={18} /> Track Order
          </Link>
          <Link to="/bulk-orders" onClick={() => toggle(false)} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-gray-700 active:bg-gray-50">
            <ShoppingBag size={18} /> Bulk Orders
          </Link>
          <a
            href={`https://wa.me/${settings?.whatsappNumber ?? ''}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-gray-700 active:bg-gray-50"
          >
            <MessageCircle size={18} /> WhatsApp Us
          </a>
        </div>

        <nav className="flex-1 px-2 py-2">
          {categories.map((cat) => (
            <div key={cat._id} className="border-b border-gray-50">
              <div className="flex items-center justify-between">
                <Link to={`/collections/${cat.slug}`} onClick={() => toggle(false)} className="flex-1 px-2 py-3 text-sm font-medium text-gray-800">
                  {cat.name}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <button
                    onClick={() => setOpenSlug(openSlug === cat.slug ? null : cat.slug)}
                    className="p-3 text-gray-500"
                    aria-label={`Toggle ${cat.name} subcategories`}
                  >
                    <ChevronDown size={16} className={openSlug === cat.slug ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </button>
                )}
              </div>
              {openSlug === cat.slug && cat.children && (
                <div className="flex flex-col gap-1 pb-2 pl-6">
                  {cat.children.map((child) => (
                    <Link
                      key={child._id}
                      to={`/collections/${child.slug}`}
                      onClick={() => toggle(false)}
                      className="py-1.5 text-sm text-gray-600"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
