import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trackOrderRequest } from '@/api/orders';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { getErrorMessage } from '@/api/axios';
import { formatDate, formatInr } from '@/utils/format';

export function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const mutation = useMutation({ mutationFn: () => trackOrderRequest(orderNumber, contact) });

  return (
    <div className="container-app max-w-xl py-12">
      <Seo title="Track Order" />
      <h1 className="mb-2 font-display text-2xl font-bold text-gray-900">Track Your Order</h1>
      <p className="mb-6 text-sm text-gray-500">Enter your order ID and the email or mobile number used at checkout.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="flex flex-col gap-3 rounded-xl border border-gray-100 p-5"
      >
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order ID (e.g. GL1234ABCD)"
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        />
        <input
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email or Mobile Number"
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
        />
        <Button type="submit" isLoading={mutation.isPending}>
          Track Order
        </Button>
      </form>

      {mutation.isError && (
        <p className="mt-4 text-sm text-red-600">{getErrorMessage(mutation.error, 'Order not found')}</p>
      )}

      {mutation.data && (
        <div className="mt-6 rounded-xl border border-gray-100 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Order #{mutation.data.orderNumber}</h2>
            <span className="text-sm text-gray-500">{formatDate(mutation.data.createdAt)}</span>
          </div>
          <OrderTimeline status={mutation.data.orderStatus} />
          <p className="mt-4 text-sm font-medium text-gray-800">Total: {formatInr(mutation.data.grandTotal)}</p>
        </div>
      )}
    </div>
  );
}
