import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '@/api/admin';
import { formatInr } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchDashboardStats });

  if (isLoading || !data) {
    return <div className="h-40 animate-pulse rounded-xl bg-gray-100" />;
  }

  const cards = [
    { label: 'Revenue', value: formatInr(data.revenue) },
    { label: 'Orders', value: data.orderCount },
    { label: 'Customers', value: data.customerCount },
    { label: 'Products', value: data.productCount },
    { label: 'Pending Orders', value: data.pendingOrders },
    { label: 'Bulk Enquiries', value: data.pendingInquiries },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent Orders</h2>
          <ul className="divide-y divide-gray-100">
            {data.recentOrders.map((order) => (
              <li key={order._id} className="flex items-center justify-between py-2 text-sm">
                <Link to={`/admin/orders/${order._id}`} className="font-medium text-gray-800 hover:text-brand-700">#{order.orderNumber}</Link>
                <Badge variant="gray">{order.orderStatus}</Badge>
                <span>{formatInr(order.grandTotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Low Stock Products</h2>
          <ul className="divide-y divide-gray-100">
            {data.lowStockProducts.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800">{p.name}</span>
                <span className="font-medium text-red-600">{p.stock} left</span>
              </li>
            ))}
            {data.lowStockProducts.length === 0 && <p className="py-2 text-sm text-gray-400">No low-stock products.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
