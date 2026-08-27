import { Link } from 'react-router-dom';
import { Heart, Menu, MessageCircle, ShoppingCart, User } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { useUiStore } from '@/store/useUiStore';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettings } from '@/hooks/useSettings';

function HeaderIconLink({
  to, icon, label, count, onClick, ariaLabel,
}: {
  to?: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick?: () => void;
  ariaLabel: string;
}) {
  const content = (
    <>
      <span className="relative">
        {icon}
        {Boolean(count) && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-[11px] font-medium leading-none lg:block">{label}</span>
    </>
  );

  const className = 'focus-ring flex shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-700 lg:px-3';

  if (to) {
    return (
      <Link to={to} className={className} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className} aria-label={ariaLabel}>
      {content}
    </button>
  );
}

export function Header() {
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="container-app flex items-center gap-2 py-2.5 sm:gap-4 sm:py-3">
        <button className="focus-ring shrink-0 rounded-lg p-1.5 lg:hidden" onClick={() => toggleMobileNav(true)} aria-label="Open menu">
          <Menu size={22} className="text-gray-700" />
        </button>

        <Link to="/" className="mr-1 flex shrink-0 items-center gap-1.5 sm:mr-2">
          <img src="/brand/greenkart-icon.webp" alt="" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
          <span className="font-display text-lg font-bold text-brand-700 sm:text-xl">GreenKart</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <a
            href={`https://wa.me/${settings?.whatsappNumber ?? ''}`}
            target="_blank"
            rel="noreferrer"
            className="focus-ring hidden shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-700 lg:flex"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle size={20} />
            <span className="text-[11px] font-medium leading-none">Chat</span>
          </a>

          <HeaderIconLink
            to={user ? '/account' : '/login'}
            icon={<User size={20} />}
            label={user ? user.firstName : 'Login'}
            ariaLabel="Account"
          />
          <HeaderIconLink to="/account/wishlist" icon={<Heart size={20} />} label="Wishlist" count={productIds.length} ariaLabel="Wishlist" />
          <HeaderIconLink icon={<ShoppingCart size={20} />} label="Cart" count={itemCount} onClick={openCartDrawer} ariaLabel="Cart" />
        </div>
      </div>

      <div className="px-3 pb-2.5 sm:px-5 md:hidden">
        <SearchBar />
      </div>

      <MegaMenu />
    </header>
  );
}
