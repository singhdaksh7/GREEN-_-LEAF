import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders } from '@/api/orders';
import { formatInr, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: fetchMyOrders });

  if (!isLoading && orders.length === 0) {
    return <EmptyState icon="📦" title="No orders yet" description="Once you place an order, it will show up here." actionLabel="Start Shopping" actionTo="/" />;
  }

  return (
    <div className="rounded-xl border border-gray-100">
      <ul className="divide-y divide-gray-100">
        {orders.map((order) => (
          <li key={order._id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <Link to={`/account/orders/${order._id}`} className="text-sm font-semibold text-gray-800 hover:text-brand-700">
                #{order.orderNumber}
              </Link>
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)} · {order.items.length} item(s)</p>
            </div>
            <Badge variant="gray">{order.orderStatus.replace(/_/g, ' ')}</Badge>
            <span className="text-sm font-medium text-gray-900">{formatInr(order.grandTotal)}</span>
            <Link to={`/account/orders/${order._id}`} className="text-xs font-medium text-brand-700 hover:underline">
              View Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
