import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

function resolveUploadUrlPath(baseUrl: string): string {
  try {
    // Absolute URL (e.g. https://example.com/uploads) -> use just the path.
    return new URL(baseUrl).pathname || '/uploads';
  } catch {
    // Already a bare path (e.g. /uploads).
    return baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  }
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/green-leaf-gardening'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',

  // File storage: defaults to a local, persistent directory suitable for any
  // normal Linux host (BigRock, a VPS, etc). Override UPLOAD_DIR with an
  // absolute path outside the app's own directory in production (e.g.
  // /home/<cpanel-user>/greenkart_uploads) so uploads survive redeploys.
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), 'uploads'),
  uploadBaseUrl: process.env.UPLOAD_BASE_URL ?? '/uploads',
  get uploadUrlPath(): string {
    return resolveUploadUrlPath(this.uploadBaseUrl);
  },
};
