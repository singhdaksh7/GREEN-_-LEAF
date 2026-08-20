import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrder } from '@/api/orders';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { formatInr, formatDate } from '@/utils/format';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const { data: order, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => fetchMyOrder(id) });

  if (isLoading || !order) {
    return <div className="animate-pulse rounded-xl border border-gray-100 p-6"><div className="h-6 w-1/3 rounded bg-gray-200" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-100 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-xs text-gray-400">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <span className="text-sm font-medium text-gray-600">Payment: {order.paymentStatus}</span>
        </div>
        <OrderTimeline status={order.orderStatus} />
      </div>

      <div className="rounded-xl border border-gray-100 p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Items</h3>
        <ul className="flex flex-col divide-y divide-gray-100">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-center gap-3 py-3">
              <img src={item.productImage} alt={item.productName} className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                {item.variant && <p className="text-xs text-gray-500">{Object.values(item.variant).join(' / ')}</p>}
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatInr(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Shipping Address</h3>
          <p className="text-sm text-gray-600">{order.shippingAddress.fullName}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress.addressLine}, {order.shippingAddress.locality}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
        </div>

        <div className="rounded-xl border border-gray-100 p-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Payment Summary</h3>
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatInr(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-sm text-brand-700"><span>Discount</span><span>-{formatInr(order.discount)}</span></div>}
          <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : formatInr(order.shipping)}</span></div>
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold text-gray-900"><span>Total</span><span>{formatInr(order.grandTotal)}</span></div>
        </div>
      </div>
    </div>
  );
}
