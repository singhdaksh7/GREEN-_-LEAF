interface ProductFiltersProps {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  minRating: number;
  minDiscount: number;
  onChange: (patch: { minPrice?: string; maxPrice?: string; inStockOnly?: boolean; minRating?: number; minDiscount?: number }) => void;
  onClear: () => void;
}

const RATING_OPTIONS = [4, 3, 2];
const DISCOUNT_OPTIONS = [10, 20, 30, 50];

export function ProductFilters({ minPrice, maxPrice, inStockOnly, minRating, minDiscount, onChange, onClear }: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <button onClick={onClear} className="text-xs font-medium text-brand-700 hover:underline">
          Clear all
        </button>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Availability</h4>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => onChange({ inStockOnly: e.target.checked })} />
          In Stock Only
        </label>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Rating</h4>
        <div className="flex flex-col gap-1.5">
          {RATING_OPTIONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="rating" checked={minRating === r} onChange={() => onChange({ minRating: r })} />
              {r}★ &amp; above
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" name="rating" checked={minRating === 0} onChange={() => onChange({ minRating: 0 })} />
            Any rating
          </label>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Discount</h4>
        <div className="flex flex-col gap-1.5">
          {DISCOUNT_OPTIONS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="discount" checked={minDiscount === d} onChange={() => onChange({ minDiscount: d })} />
              {d}% or more
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" name="discount" checked={minDiscount === 0} onChange={() => onChange({ minDiscount: 0 })} />
            Any discount
          </label>
        </div>
      </div>
    </div>
  );
}
