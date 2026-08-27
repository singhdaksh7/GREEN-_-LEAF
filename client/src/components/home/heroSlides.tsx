export interface HeroSlide {
  id: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  alt: string;
  /** Real desktop banner image. Until supplied, the slide renders a blank neutral surface. */
  desktopImage?: string;
  /** Real mobile banner image. Falls back to desktopImage, then the blank neutral surface, when omitted. */
  mobileImage?: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'grow-your-garden',
    eyebrow: 'GreenKart Gardening',
    heading: 'Grow Your Garden With GreenKart',
    subheading: 'Gardening essentials delivered to your doorstep.',
    ctaLabel: 'Shop Now',
    ctaUrl: '/collections',
    alt: 'A sunlit home garden with potted plants, ready to shop on GreenKart',
  },
  {
    id: 'pots-and-planters',
    eyebrow: 'New Collection',
    heading: 'Pots & Planters',
    subheading: 'Beautiful planters for indoor and outdoor spaces.',
    ctaLabel: 'Explore Planters',
    ctaUrl: '/collections/pots-and-planters',
    alt: 'Assorted ceramic and terracotta planters styled for indoor and outdoor spaces',
  },
  {
    id: 'tools-soil-plant-care',
    eyebrow: 'Plant Care',
    heading: 'Tools, Soil & Plant Care',
    subheading: 'Everything you need for healthier plants.',
    ctaLabel: 'Explore Gardening Essentials',
    ctaUrl: '/collections/gardening-accessories',
    alt: 'Gardening tools, soil and a watering can laid out for plant care',
  },
];
