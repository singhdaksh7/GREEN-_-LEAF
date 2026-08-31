/* eslint-disable no-console */
// Safe production-readiness check. Run with: npm run verify:production
// Never prints secret values — only whether required configuration is
// present, and non-sensitive state (connectivity, migration status, feature
// flags). Intended to be run once after deploying to Hostinger and before
// pointing the domain at it, and again after any redeploy.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { prisma, connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { storageProvider } from '../storage';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];

async function run() {
  // 1. Required configuration names present (never print their values).
  for (const name of REQUIRED_VARS) {
    check(`env:${name}`, Boolean(process.env[name]), process.env[name] ? 'set' : 'MISSING');
  }

  // 2. MySQL connectivity.
  try {
    await connectDatabase();
    await prisma.$queryRaw`SELECT 1`;
    check('database:connectivity', true, 'connected');
  } catch (error) {
    check('database:connectivity', false, error instanceof Error ? error.message : 'connection failed');
  }

  // 3. Prisma migration state — every committed migration must be applied;
  // `migrate status` exits non-zero if any are pending or the schema drifted.
  try {
    execSync('npx prisma migrate status', { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' });
    check('database:migrations', true, 'up to date');
  } catch (error) {
    const output = error instanceof Error && 'stdout' in error ? String((error as { stdout?: Buffer }).stdout) : '';
    check('database:migrations', false, output.slice(0, 500) || 'prisma migrate status failed');
  }

  // 4. Production build present — the compiled server this process itself
  // needs, and the built frontend Express will serve.
  const serverDist = path.resolve(__dirname, '../../dist/server.js');
  const clientDist = path.resolve(__dirname, '../../../client/dist/index.html');
  check('build:server', fs.existsSync(serverDist), serverDist);
  check('build:client', fs.existsSync(clientDist), clientDist);

  // 5. Upload storage writable.
  try {
    const probePath = path.join(env.uploadDir, `.verify-${Date.now()}`);
    fs.mkdirSync(env.uploadDir, { recursive: true });
    fs.writeFileSync(probePath, 'ok');
    fs.unlinkSync(probePath);
    check('storage:writable', true, `provider=${env.storageProvider}`);
  } catch (error) {
    check('storage:writable', false, error instanceof Error ? error.message : 'upload directory not writable');
  }
  void storageProvider; // referenced to keep the storage module import intentional

  // 6. Demo seed must never have run against this database.
  try {
    const demoAdmin = await prisma.user.findUnique({ where: { email: 'admin@greenleaf.example' } });
    check('database:no-demo-admin', !demoAdmin, demoAdmin ? 'demo admin account exists — remove it' : 'not present');
  } catch (error) {
    check('database:no-demo-admin', false, error instanceof Error ? error.message : 'could not check');
  }

  // 7. Razorpay: report state only, never treat either state as a failure —
  // COD-only is a valid, intentional production state before credentials
  // are supplied.
  check('razorpay:state', true, env.razorpayEnabled ? 'enabled' : 'disabled (COD-only)');

  await disconnectDatabase();

  const failed = results.filter((r) => !r.ok);
  console.log('\nProduction readiness report');
  console.log('============================');
  for (const r of results) {
    console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  console.log('============================');
  console.log(failed.length === 0 ? 'All checks passed.' : `${failed.length} check(s) failed.`);

  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error('[verify:production] Unexpected error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
