import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-1 h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
