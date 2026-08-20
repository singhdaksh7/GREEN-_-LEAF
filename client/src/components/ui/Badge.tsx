import { cn } from '@/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'accent' | 'gray' | 'red';
  className?: string;
}

const variants = {
  brand: 'bg-brand-600 text-white',
  accent: 'bg-accent-500 text-white',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-500 text-white',
};

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', variants[variant], className)}>
      {children}
    </span>
  );
}
