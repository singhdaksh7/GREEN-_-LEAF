import { Request } from 'express';
import rateLimit from 'express-rate-limit';

// req.ip already resolves correctly as long as `trust proxy` (see app.ts,
// TRUST_PROXY_HOPS) is set to the actual number of reverse-proxy hops in
// front of Node for the current hosting environment. TRUSTED_CLIENT_IP_HEADER
// is an optional escape hatch for a hosting setup that fronts the app with a
// CDN/WAF that sets its own trusted "real IP" header (e.g. Cloudflare's
// cf-connecting-ip) instead of a standard X-Forwarded-For chain — leave unset
// for a plain single-hop reverse proxy like Hostinger's default Node setup.
const trustedHeaderName = process.env.TRUSTED_CLIENT_IP_HEADER?.toLowerCase();

function clientKey(req: Request): string {
  if (trustedHeaderName) {
    const headerValue = req.headers[trustedHeaderName];
    if (typeof headerValue === 'string' && headerValue.length > 0) return headerValue;
  }
  return req.ip ?? 'unknown';
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

// Image processing (sharp resize/encode) is far more expensive per-request
// than a typical JSON admin call, so uploads get their own, stricter bucket.
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientKey,
  message: { success: false, message: 'Too many uploads, please slow down.' },
});
