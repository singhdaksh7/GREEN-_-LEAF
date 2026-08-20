const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'discount-desc', label: 'Biggest Discount' },
];

export function SortDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sort products"
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          Sort: {opt.label}
        </option>
      ))}
    </select>
  );
}
