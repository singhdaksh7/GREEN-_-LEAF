import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { BlogPost } from '../models/BlogPost';

const STATIC_PATHS = ['/', '/about', '/contact', '/blog', '/track-order', '/bulk-orders'];

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export const robotsTxt = asyncHandler(async (_req: Request, res: Response) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Disallow: /admin',
      'Disallow: /account',
      'Disallow: /checkout',
      'Allow: /',
      `Sitemap: ${env.clientUrl}/sitemap.xml`,
    ].join('\n')
  );
});

export const sitemapXml = asyncHandler(async (_req: Request, res: Response) => {
  const [products, categories, posts] = await Promise.all([
    Product.find({ isActive: true }).select('slug updatedAt').limit(2000).lean(),
    Category.find({ isActive: true }).select('slug updatedAt').limit(500).lean(),
    BlogPost.find({ isPublished: true }).select('slug updatedAt').limit(500).lean(),
  ]);

  const urls = [
    ...STATIC_PATHS.map((path) => ({ path, updatedAt: new Date() })),
    ...categories.map((c) => ({ path: `/collections/${c.slug}`, updatedAt: c.updatedAt })),
    ...products.map((p) => ({ path: `/products/${p.slug}`, updatedAt: p.updatedAt })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, updatedAt: p.updatedAt })),
  ];

  const body = urls
    .map(
      (u) => `  <url><loc>${xmlEscape(env.clientUrl + u.path)}</loc><lastmod>${new Date(u.updatedAt).toISOString()}</lastmod></url>`
    )
    .join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});
