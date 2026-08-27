/**
 * Resolves the public site origin for canonical links, Open Graph/Twitter
 * meta, and structured data. Prefers VITE_SITE_URL (set this to the real
 * GreenKart domain once it exists) and otherwise falls back to whatever
 * origin the page is actually being served from, so dev/preview builds
 * never emit a hardcoded or invented production URL.
 */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path.startsWith('/')) path = `/${path}`;
  return `${base}${path}`;
}
