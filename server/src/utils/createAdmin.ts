/* eslint-disable no-console */
// Production admin bootstrap. Run with:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run create-admin
// or:
//   npm run create-admin -- --email you@example.com --password 'a-strong-password'
//
// Never prints the password, is safe to re-run (idempotent — an existing
// account is only promoted to ADMIN, never has its password silently
// overwritten), and is the only supported way to get an admin account in a
// production deployment. The demo seed (server/src/utils/seed.ts) refuses to
// run when NODE_ENV=production for exactly this reason.
import bcrypt from 'bcryptjs';
import { prisma, connectDatabase, disconnectDatabase } from '../config/db';

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return undefined;
  return process.argv[index + 1];
}

async function run() {
  const email = (readArg('--email') ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = readArg('--password') ?? process.env.ADMIN_PASSWORD ?? '';

  if (!email || !email.includes('@')) {
    console.error('[create-admin] A valid admin email is required (ADMIN_EMAIL or --email).');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('[create-admin] Password must be at least 8 characters (ADMIN_PASSWORD or --password).');
    process.exit(1);
  }

  await connectDatabase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === 'ADMIN' || existing.role === 'SUPER_ADMIN') {
      console.log(`[create-admin] ${email} is already an admin. No changes made.`);
    } else {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
      console.log(`[create-admin] Promoted existing account ${email} to ADMIN.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name: 'Admin', email, passwordHash, role: 'ADMIN' } });
    console.log(`[create-admin] Created admin account for ${email}.`);
  }

  await disconnectDatabase();
  process.exit(0);
}

run().catch((error) => {
  console.error('[create-admin] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
