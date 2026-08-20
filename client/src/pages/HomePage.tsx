import { Seo } from '@/components/seo/Seo';
import { Hero } from '@/components/home/Hero';
import { CollectionRail } from '@/components/home/CollectionRail';
import { ProductSection } from '@/components/home/ProductSection';
import { PromoBanners } from '@/components/home/PromoBanners';
import { WhyShopWithUs } from '@/components/home/WhyShopWithUs';
import { FaqSection } from '@/components/home/FaqSection';

export function HomePage() {
  return (
    <>
      <Seo
        title="Gardening Essentials, Delivered"
        description="Shop premium plant pots, seeds, fertilizers and gardening tools. Free shipping across India on orders above ₹999."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Green Leaf',
          url: 'https://greenleaf.example',
        }}
      />
      <Hero />
      <CollectionRail />
      <ProductSection title="Best Sellers" subtitle="Loved by gardeners across India" viewAllTo="/collections/best-sellers" params={{ bestSeller: true }} />
      <ProductSection title="Today's Gardening Deals" subtitle="Save more on handpicked essentials" viewAllTo="/collections/offers" params={{ minDiscount: 20, sort: 'discount-desc' }} />
      <PromoBanners />
      <ProductSection title="New Arrivals" subtitle="Fresh additions to our catalogue" viewAllTo="/collections/new-arrivals" params={{ newArrival: true }} />
      <WhyShopWithUs />
      <FaqSection />
    </>
  );
}
