import { Request } from 'express';
import rateLimit from 'express-rate-limit';

// Render's onrender.com domains sit behind Cloudflare, which always sets
// cf-connecting-ip to the true client IP (overwriting any client-supplied
// value), regardless of how many internal proxy hops sit between Cloudflare
// and the app. Relying on req.ip (X-Forwarded-For + trust proxy hop count)
// alone proved unreliable here, bucketing the same client inconsistently.
function clientKey(req: Request): string {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.length > 0) return cfConnectingIp;
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
