import path from 'node:path';
import { execSync } from 'node:child_process';
import { prisma, disconnectDatabase } from '../../src/config/db';

/**
 * Integration tests run against a real MySQL database (TEST_DATABASE_URL,
 * defaulted in test/helpers/setupEnv.ts to a `greenkart_test` database on
 * the same local/dev MySQL server used by `docker-compose.yml`) — never
 * against the dev database, and never mocked. `prisma db push` creates the
 * test database and brings its schema in sync with prisma/schema.prisma if
 * it doesn't already match; it's a fast no-op when already in sync, which
 * is the common case across the whole suite run.
 */
let schemaReady = false;

export async function setupTestDb(): Promise<void> {
  if (!schemaReady) {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env,
      stdio: 'pipe',
    });
    schemaReady = true;
  }
  await prisma.$connect();
}

export async function teardownTestDb(): Promise<void> {
  await disconnectDatabase();
}

// Deletes every row from every table between tests, in an order that
// respects foreign keys — children before parents. Disabling FK checks
// around it would be simpler but would silently hide an accidentally
// missing table in this list, which a hard failure here catches instead.
const TABLES_CHILD_TO_PARENT = [
  'PaymentIntentLine', 'PaymentIntent',
  'OrderStatusHistory', 'OrderItem', 'Order',
  'WishlistItem', 'Wishlist',
  'CartItem', 'Cart',
  'Review',
  'VariantAttribute', 'VariantImage', 'ProductVariant',
  'ProductAttribute', 'ProductTag', 'ProductImage', 'Product',
  'Coupon',
  'Category',
  'Address',
  'BlogPost',
  'NewsletterSubscriber',
  'BulkOrderInquiry',
  'SiteSettings',
  'User',
] as const;

export async function clearTestDb(): Promise<void> {
  for (const table of TABLES_CHILD_TO_PARENT) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
  }
}
