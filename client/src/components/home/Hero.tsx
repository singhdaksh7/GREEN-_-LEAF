import { Link } from 'react-router-dom';
import { HeroIllustration } from './HeroIllustration';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-50">
      <div className="container-app grid grid-cols-1 items-center gap-6 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-12">
        <div>
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            🌿 Grow Better
          </span>
          <h1 className="font-display text-2xl font-bold leading-[1.15] text-gray-900 sm:text-3xl lg:text-[2.6rem]">
            Everything Your Garden Needs
          </h1>
          <p className="mt-3 max-w-md text-sm text-gray-600 sm:text-base">
            Premium gardening essentials — pots, seeds, soil &amp; tools — delivered across India.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/collections/best-sellers" className="focus-ring rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:px-6 sm:py-3">
              Shop Now
            </Link>
            <Link to="/collections" className="focus-ring rounded-lg border border-brand-600 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 sm:px-6 sm:py-3">
              Explore Collections
            </Link>
          </div>
        </div>
        <div className="relative">
          <HeroIllustration className="aspect-[16/9] w-full rounded-xl shadow-cardHover lg:aspect-[4/3]" />
        </div>
      </div>
    </section>
  );
}
