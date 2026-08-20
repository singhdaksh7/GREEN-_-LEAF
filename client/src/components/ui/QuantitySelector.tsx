import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ quantity, onChange, min = 1, max = 99, size = 'md' }: QuantitySelectorProps) {
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={`flex ${btnSize} items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40`}
        disabled={quantity <= min}
        onClick={() => onChange(Math.max(min, quantity - 1))}
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={`flex ${btnSize} items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40`}
        disabled={quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
