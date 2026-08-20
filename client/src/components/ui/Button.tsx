import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'bg-accent-500 text-white hover:bg-accent-600 disabled:bg-accent-300',
  outline: 'border border-brand-600 text-brand-700 hover:bg-brand-50 disabled:opacity-50',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
