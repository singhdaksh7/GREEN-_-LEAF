import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const activeHasImage = Boolean(HERO_SLIDES[activeIndex]?.desktopImage);

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
            const hasImage = Boolean(slide.desktopImage);
            return (
              <div
                key={slide.id}
                className="relative h-full w-full shrink-0 grow-0 basis-full bg-gradient-to-br from-brand-50 via-white to-brand-100"
                aria-hidden={!isActive}
              >
                {hasImage && (
                  <>
                    <picture>
                      {slide.mobileImage && <source media="(max-width: 639px)" srcSet={slide.mobileImage} />}
                      <img
                        src={slide.desktopImage}
                        alt={slide.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                      />
                    </picture>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-brand-900/35 to-transparent"
                      aria-hidden="true"
                    />
                  </>
                )}
                <div className="container-app relative flex h-full items-center">
                  <div className="max-w-md py-8 sm:max-w-lg">
                    {slide.eyebrow && (
                      <span
                        className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          hasImage ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-[2px]' : 'bg-brand-600 text-white'
                        }`}
                      >
                        {slide.eyebrow}
                      </span>
                    )}
                    <h2
                      className={`font-display text-2xl font-bold leading-[1.15] sm:text-3xl lg:text-[2.6rem] ${
                        hasImage ? 'text-white drop-shadow-sm' : 'text-gray-900'
                      }`}
                    >
                      {slide.heading}
                    </h2>
                    {slide.subheading && (
                      <p
                        className={`mt-3 max-w-md text-sm sm:text-base ${
                          hasImage ? 'text-white/90 drop-shadow-sm' : 'text-gray-600'
                        }`}
                      >
                        {slide.subheading}
                      </p>
                    )}
                    {slide.ctaLabel && slide.ctaUrl && (
                      <div className="mt-5">
                        <Link
                          to={slide.ctaUrl}
                          tabIndex={isActive ? 0 : -1}
                          className="focus-ring inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:px-6 sm:py-3"
                        >
                          {slide.ctaLabel}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
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
                activeHasImage
                  ? index === activeIndex
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                  : index === activeIndex
                    ? 'w-6 bg-brand-600'
                    : 'w-2 bg-brand-600/30 hover:bg-brand-600/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
