import path from 'node:path';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/db';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limit';
import { robotsTxt, sitemapXml } from './controllers/sitemap.controller';
import { razorpayWebhookHandler } from './controllers/payment.controller';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp(): Express {
  const app = express();

  // Number of reverse-proxy hops to trust for X-Forwarded-* headers
  // (secure-cookie detection, rate-limiting IP, req.protocol/req.ip).
  // A managed Node host's reverse proxy (e.g. Hostinger) is typically a
  // single hop in front of Node — configurable via TRUST_PROXY_HOPS for
  // any hosting topology that differs (e.g. an extra CDN/load balancer).
  if (env.isProd) {
    app.set('trust proxy', env.trustProxyHops);
  }

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());

  // Must be registered before the JSON body parser below: Razorpay webhook
  // signature verification needs the exact raw request bytes, and this
  // route fully handles (and terminates) the request before it ever
  // reaches express.json().
  app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }), razorpayWebhookHandler);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isProd) {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK', uptime: process.uptime() });
  });

  app.get('/api/health', async (_req, res) => {
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    res.status(200).json({
      success: true,
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
    });
  });

  app.get('/robots.txt', robotsTxt);
  app.get('/sitemap.xml', sitemapXml);

  // Serves uploaded product images from the configured persistent directory
  // (UPLOAD_DIR). If the hosting platform is ever configured to serve this
  // directory directly at the edge, this route is redundant but harmless.
  app.use(env.uploadUrlPath, express.static(env.uploadDir));

  app.use('/api', apiRateLimiter, apiRoutes);
  app.use('/api', notFoundHandler);

  if (env.isProd) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
