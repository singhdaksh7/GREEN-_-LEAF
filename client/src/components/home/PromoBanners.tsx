import { Link } from 'react-router-dom';

const BANNERS = [
  {
    title: 'Grow Your Own Vegetables',
    subtitle: 'Fresh starts at home',
    cta: 'Shop Seeds',
    to: '/collections/vegetable-seeds',
    emoji: '🥕',
    from: '#dcf0da',
    to2: '#8fcc89',
  },
  {
    title: 'Upgrade Your Balcony',
    subtitle: 'Planters designed for modern homes',
    cta: 'Shop Planters',
    to: '/collections/pots-and-planters',
    emoji: '🪴',
    from: '#f2e9dd',
    to2: '#e0b98a',
  },
];

export function PromoBanners() {
  return (
    <section className="container-app grid grid-cols-1 gap-4 py-7 sm:grid-cols-2 sm:py-9">
      {BANNERS.map((banner) => (
        <Link
          key={banner.title}
          to={banner.to}
          className="group relative flex aspect-[16/9] items-center overflow-hidden rounded-2xl"
          style={{ background: `linear-gradient(135deg, ${banner.from}, ${banner.to2})` }}
        >
          <span className="absolute -right-6 -top-6 text-[160px] leading-none opacity-40 transition-transform duration-500 group-hover:scale-110 sm:text-[200px]">
            {banner.emoji}
          </span>
          <div className="relative z-10 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800/70">{banner.subtitle}</p>
            <h3 className="mt-1 font-display text-xl font-bold text-gray-900 sm:text-2xl">{banner.title}</h3>
            <span className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-brand-700">
              {banner.cta} →
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
