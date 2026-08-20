import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { suggestSearch } from '@/api/search';
import { useDebounce } from '@/hooks/useDebounce';
import { formatInr } from '@/utils/format';

export function SearchBar({ className = '' }: { className?: string }) {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debounced = useDebounce(term, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['search-suggest', debounced],
    queryFn: () => suggestSearch(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function submitSearch(q: string) {
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setIsOpen(false);
  }

  const hasSuggestions = Boolean(data && (data.products.length > 0 || data.categories.length > 0));

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(term);
        }}
        className="flex items-center rounded-lg border border-gray-300 bg-gray-50 focus-within:border-brand-500 focus-within:bg-white"
      >
        <Search size={18} className="ml-3 shrink-0 text-gray-400" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          type="search"
          placeholder="Search for pots, seeds, fertilizers..."
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          aria-label="Search products"
        />
        {term && (
          <button type="button" onClick={() => setTerm('')} className="mr-2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </form>

      {isOpen && debounced.trim().length >= 2 && hasSuggestions && (
        <div className="absolute z-40 mt-1 w-full rounded-lg border border-gray-100 bg-white py-2 shadow-cardHover">
          {data!.categories.length > 0 && (
            <div className="px-3 pb-2">
              <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Categories</p>
              {data!.categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    navigate(`/collections/${cat.slug}`);
                    setIsOpen(false);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-brand-50"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          {data!.products.length > 0 && (
            <div className="border-t border-gray-100 px-3 pt-2">
              <p className="mb-1 text-[11px] font-semibold uppercase text-gray-400">Products</p>
              {data!.products.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    navigate(`/products/${p.slug}`);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-brand-50"
                >
                  <img src={p.images[0]} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="flex-1 truncate text-sm text-gray-700">{p.name}</span>
                  <span className="text-xs font-medium text-gray-500">{formatInr(p.salePrice)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
