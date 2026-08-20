import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fallbackImage =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#f1f9f0"/><text x="400" y="420" font-size="180" text-anchor="middle" dominant-baseline="middle">🪴</text></svg>'
    );
  const safeImages = images.length > 0 ? images : [fallbackImage];

  function go(delta: number) {
    setActiveIndex((i) => (i + delta + safeImages.length) % safeImages.length);
  }

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-xl bg-gray-50">
        <img src={safeImages[activeIndex]} alt={alt} className="h-full w-full object-cover" />

        {safeImages.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
          aria-label="View fullscreen"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {safeImages.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === activeIndex ? 'border-brand-600' : 'border-transparent'}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setIsFullscreen(false)}>
          <button className="absolute right-6 top-6 text-white" onClick={() => setIsFullscreen(false)} aria-label="Close fullscreen">
            <X size={28} />
          </button>
          <img src={safeImages[activeIndex]} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
