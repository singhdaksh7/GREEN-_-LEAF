import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrders } from '@/api/admin';
import { formatInr, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/Badge';

const STATUS_OPTIONS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data } = useQuery({ queryKey: ['admin-orders', page, status], queryFn: () => fetchAdminOrders({ page, status: status || undefined }) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-50">
                <td className="p-3 font-medium text-gray-800">#{order.orderNumber}</td>
                <td className="p-3 text-gray-500">
                  {typeof order.user === 'object' ? `${(order.user as unknown as { firstName: string }).firstName}` : ''}
                </td>
                <td className="p-3 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="p-3"><Badge variant="gray">{order.orderStatus}</Badge></td>
                <td className="p-3 font-medium">{formatInr(order.grandTotal)}</td>
                <td className="p-3">
                  <Link to={`/admin/orders/${order._id}`} className="text-xs font-medium text-brand-700 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 rounded-lg text-sm ${p === page ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
