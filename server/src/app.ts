import path from 'node:path';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limit';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp(): Express {
  const app = express();

  if (env.isProd) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  if (!env.isProd) {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK', uptime: process.uptime() });
  });

  app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
      success: true,
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
    });
  });

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
