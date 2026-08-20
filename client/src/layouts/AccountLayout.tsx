import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, MapPin, Heart, User, Lock, LogOut } from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';
import { Seo } from '@/components/seo/Seo';

const NAV_ITEMS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/change-password', label: 'Change Password', icon: Lock },
];

export function AccountLayout() {
  const logout = useLogout();

  return (
    <div className="container-app py-8">
      <Seo title="My Account" />
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">My Account</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => logout.mutate()}
            className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
