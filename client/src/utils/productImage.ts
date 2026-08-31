import { SyntheticEvent } from 'react';
import { Product } from '@/types';

/** Inline neutral placeholder — never a network request, so it can never itself 404. */
export const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#f3f4f6"/>' +
      '<g fill="#9ca3af">' +
      '<path d="M140 250h120l-30-45-25 30-15-20z"/>' +
      '<circle cx="160" cy="165" r="16"/>' +
      '<rect x="120" y="140" width="160" height="120" rx="8" fill="none" stroke="#9ca3af" stroke-width="6"/>' +
      '</g>' +
      '</svg>'
  );

/** Handles both the current structured `images` shape and any legacy plain-string array left over from older data. */
export function getPrimaryImageUrl(product: Pick<Product, 'images'> | { images: unknown[] }): string {
  const images = product.images as unknown[];
  if (!Array.isArray(images) || images.length === 0) return FALLBACK_PRODUCT_IMAGE;

  const primary = (images as { url?: string; isPrimary?: boolean }[]).find((img) => typeof img === 'object' && img?.isPrimary);
  const first = images[0];

  if (primary?.url) return primary.url;
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url || FALLBACK_PRODUCT_IMAGE;
  return FALLBACK_PRODUCT_IMAGE;
}

/** Ordered list of image URLs (sortOrder ascending), for galleries/SEO/JSON-LD. Handles legacy string arrays too. */
export function getOrderedImageUrls(product: Pick<Product, 'images'> | { images: unknown[] }): string[] {
  const images = product.images as unknown[];
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => (typeof image === 'string' ? { url: image, sortOrder: 0 } : (image as { url: string; sortOrder?: number })))
    .filter((image) => Boolean(image?.url))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((image) => image.url);
}

export function onProductImageError(event: SyntheticEvent<HTMLImageElement>): void {
  const target = event.currentTarget;
  if (target.src !== FALLBACK_PRODUCT_IMAGE) target.src = FALLBACK_PRODUCT_IMAGE;
}
