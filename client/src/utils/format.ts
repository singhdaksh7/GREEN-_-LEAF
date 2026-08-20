export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPercent(mrp: number, salePrice: number): number {
  if (mrp <= 0 || salePrice >= mrp) return 0;
  return Math.round(((mrp - salePrice) / mrp) * 100);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}
