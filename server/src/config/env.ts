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

const isProd = process.env.NODE_ENV === 'production';

// Razorpay is an all-or-nothing optional group: either none of the three
// variables are set (COD-only mode) or all three are (Pay Online enabled).
// A partial configuration is almost always a typo/incomplete deploy, and
// silently treating it as "disabled" could mask a real misconfiguration —
// so it fails fast at boot with a clear message instead of guessing.
const razorpayVars = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
};
const razorpaySetCount = Object.values(razorpayVars).filter((v) => v && v.length > 0).length;
if (razorpaySetCount > 0 && razorpaySetCount < 3) {
  const missing = Object.entries(razorpayVars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  throw new Error(
    `Incomplete Razorpay configuration: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. ` +
      'Set all three RAZORPAY_* variables to enable Pay Online, or none of them to run COD-only.'
  );
}

// Fails fast in production if a secret was left at its insecure local-dev
// default — these fallbacks exist only to make `npm run dev` work without
// any .env file, never to be usable in a real deployment.
const DEV_ONLY_SECRETS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'dev-access-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
};
if (isProd) {
  for (const [name, devValue] of Object.entries(DEV_ONLY_SECRETS)) {
    if (process.env[name] === devValue || !process.env[name]) {
      throw new Error(`${name} must be set to a real secret in production (refusing to start with the dev default).`);
    }
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: required('DATABASE_URL', 'mysql://root:root@localhost:3306/greenkart'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', DEV_ONLY_SECRETS.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', DEV_ONLY_SECRETS.JWT_REFRESH_SECRET),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  isProd,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  razorpayEnabled: razorpaySetCount === 3,

  // Number of reverse-proxy hops Express should trust when reading
  // X-Forwarded-* headers (Express `trust proxy` setting). Most managed
  // Node hosts (e.g. Hostinger) front Node with a single reverse-proxy hop,
  // so this defaults to 1 — set it explicitly if your hosting setup differs
  // (e.g. an extra CDN in front adds another hop).
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 1),

  // File storage: defaults to a local, persistent directory suitable for any
  // normal Linux host (Hostinger, a VPS, etc). Override UPLOAD_DIR with an
  // absolute path outside the app's own directory in production (the exact
  // persistent path is provided by whoever configures the host) so uploads
  // survive redeploys.
  storageProvider: process.env.STORAGE_PROVIDER ?? 'local',
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(process.cwd(), 'uploads'),
  uploadBaseUrl: process.env.UPLOAD_BASE_URL ?? '/uploads',
  get uploadUrlPath(): string {
    return resolveUploadUrlPath(this.uploadBaseUrl);
  },
};
