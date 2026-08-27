import { useEffect, useState } from 'react';
import { CollectionFilters } from '@/utils/productFilters';

interface FilterOptions { subcategories: { name: string; slug: string }[]; attributes: Record<string, string[]>; }
interface ProductFiltersProps { filters: CollectionFilters; options?: FilterOptions; onChange: (filters: CollectionFilters) => void; onClear: () => void; }
const RATING_OPTIONS = [4, 3, 2];
const DISCOUNT_OPTIONS = [10, 20, 30, 40];
const labelForAttribute = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());

export function ProductFilters({ filters, options, onChange, onClear }: ProductFiltersProps) {
  const [priceDraft, setPriceDraft] = useState({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });
  useEffect(() => setPriceDraft({ minPrice: filters.minPrice, maxPrice: filters.maxPrice }), [filters.minPrice, filters.maxPrice]);
  const update = (patch: Partial<CollectionFilters>) => onChange({ ...filters, ...patch });
  const toggle = (key: 'subcategory' | string, value: string) => {
    const current = key === 'subcategory' ? filters.subcategory : (filters.attributes[key] ?? []);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    if (key === 'subcategory') update({ subcategory: next }); else update({ attributes: { ...filters.attributes, [key]: next } });
  };
  return <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900">Filters</h3><button onClick={onClear} className="focus-ring text-xs font-medium text-brand-700 hover:underline">Clear all</button></div>
    <section><h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Price range</h4><div className="flex gap-2"><label className="sr-only" htmlFor="min-price">Minimum price</label><input id="min-price" type="number" min="0" placeholder="Min" value={priceDraft.minPrice} onChange={(e) => setPriceDraft((draft) => ({ ...draft, minPrice: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /><label className="sr-only" htmlFor="max-price">Maximum price</label><input id="max-price" type="number" min="0" placeholder="Max" value={priceDraft.maxPrice} onChange={(e) => setPriceDraft((draft) => ({ ...draft, maxPrice: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" /></div><button onClick={() => update(priceDraft)} className="focus-ring mt-2 text-xs font-medium text-brand-700 hover:underline">Apply price</button></section>
    {options?.subcategories.length ? <FilterGroup title="Subcategory" values={options.subcategories.map((item) => ({ value: item.slug, label: item.name }))} selected={filters.subcategory} onToggle={(value) => toggle('subcategory', value)} /> : null}
    <section><h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Availability</h4><label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={filters.inStock} onChange={(event) => update({ inStock: event.target.checked })} /> In stock</label></section>
    <section><h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Rating</h4>{RATING_OPTIONS.map((rating) => <label key={rating} className="flex items-center gap-2 py-0.5 text-sm text-gray-700"><input type="radio" name="rating" checked={filters.minRating === rating} onChange={() => update({ minRating: rating })} /> {rating}★ &amp; above</label>)}<label className="flex items-center gap-2 py-0.5 text-sm text-gray-700"><input type="radio" name="rating" checked={!filters.minRating} onChange={() => update({ minRating: 0 })} /> Any rating</label></section>
    <section><h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Discount</h4>{DISCOUNT_OPTIONS.map((discount) => <label key={discount} className="flex items-center gap-2 py-0.5 text-sm text-gray-700"><input type="radio" name="discount" checked={filters.minDiscount === discount} onChange={() => update({ minDiscount: discount })} /> {discount}%+ off</label>)}</section>
    {Object.entries(options?.attributes ?? {}).map(([key, values]) => <FilterGroup key={key} title={labelForAttribute(key)} values={values.map((value) => ({ value, label: value }))} selected={filters.attributes[key] ?? []} onToggle={(value) => toggle(key, value)} />)}
  </div>;
}

function FilterGroup({ title, values, selected, onToggle }: { title: string; values: { value: string; label: string }[]; selected: string[]; onToggle: (value: string) => void }) {
  return <section><h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">{title}</h4><div className="flex flex-col gap-1.5">{values.map(({ value, label }) => <label key={value} className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /> {label}</label>)}</div></section>;
}
