import { formatInr, discountPercent } from '@/utils/format';

interface PriceProps {
  mrp: number;
  salePrice: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { sale: 'text-sm', mrp: 'text-xs', badge: 'text-[10px]' },
  md: { sale: 'text-base', mrp: 'text-sm', badge: 'text-xs' },
  lg: { sale: 'text-2xl', mrp: 'text-base', badge: 'text-sm' },
};

export function Price({ mrp, salePrice, size = 'md' }: PriceProps) {
  const pct = discountPercent(mrp, salePrice);
  const classes = sizeClasses[size];

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-semibold text-gray-900 ${classes.sale}`}>{formatInr(salePrice)}</span>
      {pct > 0 && (
        <>
          <span className={`text-gray-400 line-through ${classes.mrp}`}>{formatInr(mrp)}</span>
          <span className={`font-medium text-accent-600 ${classes.badge}`}>{pct}% OFF</span>
        </>
      )}
    </div>
  );
}
