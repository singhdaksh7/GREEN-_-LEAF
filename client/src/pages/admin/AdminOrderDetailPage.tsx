import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchAdminOrder, updateAdminOrderStatusRequest } from '@/api/admin';
import { formatInr, formatDate } from '@/utils/format';
import { OrderStatus } from '@/types';
import { getErrorMessage } from '@/api/axios';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED',
];

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({ queryKey: ['admin-order', id], queryFn: () => fetchAdminOrder(id) });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateAdminOrderStatusRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      toast.success('Order status updated');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update status')),
  });

  if (isLoading || !order) return <div className="h-40 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
        <select
          value={order.orderStatus}
          onChange={(e) => statusMutation.mutate(e.target.value as OrderStatus)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Items</h2>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 py-2 text-sm">
                <img src={item.productImage} alt="" className="h-10 w-10 rounded object-cover" />
                <span className="flex-1">{item.productName} × {item.quantity}</span>
                <span>{formatInr(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatInr(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-{formatInr(order.discount)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{formatInr(order.shipping)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{formatInr(order.grandTotal)}</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Shipping Address</h2>
            <p className="text-sm text-gray-600">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress.addressLine}, {order.shippingAddress.locality}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress.phone} · {order.shippingAddress.email}</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">Status History</h2>
            <ul className="flex flex-col gap-1 text-sm text-gray-600">
              {order.statusHistory.map((h, i) => (
                <li key={i}>{h.status} — {formatDate(h.changedAt)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
