import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '@/api/orders';
import { useAuthStore } from '@/store/useAuthStore';
import { formatInr, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';

export function AccountDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: fetchMyOrders });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-900">Hi, {user?.name} 👋</h2>
        <p className="mt-1 text-sm text-gray-500">Welcome back to your GreenKart account.</p>
      </div>

      <div className="rounded-xl border border-gray-100 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
          <Link to="/account/orders" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">You haven&apos;t placed any orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {orders.slice(0, 3).map((order) => (
              <li key={order._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <Link to={`/account/orders/${order._id}`} className="font-medium text-gray-800 hover:text-brand-700">
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <Badge variant="gray">{order.orderStatus.replace(/_/g, ' ')}</Badge>
                <span className="font-medium text-gray-900">{formatInr(order.grandTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
