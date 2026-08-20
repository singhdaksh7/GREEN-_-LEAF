import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1 py-8" aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, idx) => (
        <span key={p} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
              p === page ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
