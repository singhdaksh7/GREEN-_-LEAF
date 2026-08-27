import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, ShoppingBag, Users, TicketPercent,
  Star, Mail, Newspaper, Settings, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/bulk-orders', label: 'Bulk Orders', icon: Mail },
  { to: '/admin/blog', label: 'Blog', icon: Newspaper },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-gray-100 p-4">
          <img src="/brand/greenkart-icon.webp" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-lg font-bold text-brand-700">GreenKart Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 px-3 text-xs text-gray-500">{user?.email}</div>
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
