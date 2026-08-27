export interface HeroSlide {
  id: string;
  alt: string;
  /** Real desktop banner image. Until supplied, the slide renders a blank neutral surface. */
  desktopImage?: string;
  /** Real mobile banner image. Falls back to desktopImage, then the blank neutral surface, when omitted. */
  mobileImage?: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'grow-your-garden',
    alt: 'A sunlit home garden with potted plants, ready to shop on GreenKart',
  },
  {
    id: 'pots-and-planters',
    alt: 'Assorted ceramic and terracotta planters styled for indoor and outdoor spaces',
  },
  {
    id: 'tools-soil-plant-care',
    alt: 'Gardening tools, soil and a watering can laid out for plant care',
  },
];
