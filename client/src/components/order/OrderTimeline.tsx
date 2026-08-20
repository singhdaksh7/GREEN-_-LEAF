import { CheckCircle2, Circle } from 'lucide-react';
import { OrderStatus } from '@/types';
import { cn } from '@/utils/cn';

const TIMELINE_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'RETURN_REQUESTED' || status === 'RETURNED') {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Order {status.replace(/_/g, ' ').toLowerCase()}
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-center">
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index <= currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-2 sm:flex-col sm:text-center">
            <div className="flex items-center gap-2 sm:flex-col">
              {isDone ? <CheckCircle2 size={20} className="text-brand-600" /> : <Circle size={20} className="text-gray-300" />}
              {index < TIMELINE_STEPS.length - 1 && (
                <div className={cn('h-0.5 flex-1 sm:mt-0 sm:h-0.5 sm:w-full', isDone ? 'bg-brand-600' : 'bg-gray-200')} />
              )}
            </div>
            <span className={cn('text-xs font-medium', isDone ? 'text-gray-800' : 'text-gray-400')}>{LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
