import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from './heroSlides';

const AUTOPLAY_INTERVAL_MS = 4500;
const SWIPE_THRESHOLD_PX = 50;

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function HeroCarousel() {
  const slideCount = HERO_SLIDES.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goToNext = useCallback(() => goToSlide(activeIndex + 1), [activeIndex, goToSlide]);
  const goToPrevious = useCallback(() => goToSlide(activeIndex - 1), [activeIndex, goToSlide]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, isPaused, prefersReducedMotion, slideCount]);

  const handleManualNav = (action: () => void) => {
    action();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) {
      handleManualNav(goToNext);
    } else {
      handleManualNav(goToPrevious);
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-brand-50"
      role="region"
      aria-roledescription="carousel"
      aria-label="GreenKart promotional banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div
        className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[560px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;
            const imageSrc = slide.desktopImage ?? slide.mobileImage;
            const hasImage = Boolean(imageSrc);
            return (
              <div
                key={slide.id}
                className="relative h-full w-full shrink-0 grow-0 basis-full bg-brand-50"
                aria-hidden={!isActive}
              >
                {hasImage && (
                  <picture>
                    {slide.mobileImage && <source media="(max-width: 639px)" srcSet={slide.mobileImage} />}
                    <img
                      src={imageSrc}
                      alt={slide.alt}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                    />
                  </picture>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleManualNav(goToPrevious)}
          aria-label="Previous slide"
          className="focus-ring absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-800 shadow-sm hover:bg-white sm:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => handleManualNav(goToNext)}
          aria-label="Next slide"
          className="focus-ring absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-gray-800 shadow-sm hover:bg-white sm:flex"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => handleManualNav(() => goToSlide(index))}
              aria-label={`Go to slide ${index + 1} of ${slideCount}`}
              aria-current={index === activeIndex}
              className={`focus-ring h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-brand-600' : 'w-2 bg-brand-600/30 hover:bg-brand-600/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
