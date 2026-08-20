import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
}

export function StarRating({ rating, reviewCount = 0, size = 14, showCount = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={cn(i <= Math.round(rating) ? 'fill-accent-500 text-accent-500' : 'fill-gray-200 text-gray-200')}
          />
        ))}
      </div>
      {showCount && reviewCount > 0 && <span className="text-xs text-gray-500">({reviewCount})</span>}
    </div>
  );
}
