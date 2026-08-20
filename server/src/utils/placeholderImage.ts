/**
 * Locally generated, deterministic SVG placeholder images for catalogue data.
 * No external image service or scraped photography — each image is drawn
 * from the product/category name so it always visually corresponds to what
 * it represents, with a consistent neutral background and aspect ratio.
 * Swap this module for a real asset pipeline (Cloudinary/S3) later without
 * touching callers, since they only depend on the returned string being a
 * valid <img src>.
 */

const TINTS = ['#eaf4e8', '#f0ece0', '#e7f1f5', '#f2e9ec', '#eef0e4'];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * A single catalogue image: neutral background with a category-coloured
 * badge and an emoji representing the product type. No baked-in text —
 * the product name is already shown by the surrounding UI, so repeating
 * it inside the image would read as a placeholder rather than a photo.
 */
export function generateProductImage(name: string, emoji: string, variantIndex = 0): string {
  const size = 900;
  const tint = TINTS[(hashString(name) + variantIndex) % TINTS.length];
  const badgeOffset = variantIndex % 2 === 0 ? 0 : 10;
  const badgeScale = 1 + (variantIndex % 3) * 0.03;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    <rect x="24" y="24" width="${size - 48}" height="${size - 48}" rx="18" fill="${tint}"/>
    <circle cx="${size / 2}" cy="${size / 2 + badgeOffset}" r="240" fill="#ffffff" opacity="0.55"/>
    <g transform="translate(${size / 2} ${size / 2 + badgeOffset}) scale(${badgeScale})">
      <text x="0" y="0" font-size="280" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    </g>
  </svg>`;

  return svgToDataUri(svg);
}

/** A wider lifestyle-style banner placeholder (hero/promo), not tied to a single product. */
export function generateBannerImage(label: string, emoji: string, width = 1000, height = 560): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#dcf0da"/>
        <stop offset="100%" stop-color="#8fcc89"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <text x="${width / 2}" y="${height / 2 - 20}" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="${width / 2}" y="${height / 2 + 130}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#1a3c1b" text-anchor="middle">${escapeXml(label)}</text>
  </svg>`;

  return svgToDataUri(svg);
}

/** A compact circular/square category thumbnail. */
export function generateCategoryImage(name: string, emoji: string): string {
  const size = 400;
  const tint = TINTS[hashString(name) % TINTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${tint}"/>
    <text x="${size / 2}" y="${size / 2}" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;

  return svgToDataUri(svg);
}
