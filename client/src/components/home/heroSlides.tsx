import type { ComponentType } from 'react';
import { GardenVisual, PlantersVisual, ToolsVisual } from './HeroSlideVisuals';

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  alt: string;
  /** Real desktop banner image, when available. Falls back to Visual when omitted. */
  desktopImage?: string;
  /** Real mobile banner image, when available. Falls back to desktopImage/Visual when omitted. */
  mobileImage?: string;
  /** CSS/SVG placeholder visual used until real marketing photography is supplied. */
  Visual: ComponentType<{ className?: string }>;
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
    Visual: GardenVisual,
  },
  {
    id: 'pots-and-planters',
    eyebrow: 'New Collection',
    heading: 'Pots & Planters',
    subheading: 'Beautiful planters for indoor and outdoor spaces.',
    ctaLabel: 'Explore Planters',
    ctaUrl: '/collections/pots-and-planters',
    alt: 'Assorted ceramic and terracotta planters styled for indoor and outdoor spaces',
    Visual: PlantersVisual,
  },
  {
    id: 'tools-soil-plant-care',
    eyebrow: 'Plant Care',
    heading: 'Tools, Soil & Plant Care',
    subheading: 'Everything you need for healthier plants.',
    ctaLabel: 'Explore Gardening Essentials',
    ctaUrl: '/collections/gardening-accessories',
    alt: 'Gardening tools, soil and a watering can laid out for plant care',
    Visual: ToolsVisual,
  },
];
