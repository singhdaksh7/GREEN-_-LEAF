/* eslint-disable no-console */
// Post-migration validation report for the Mongo -> MySQL migration
// (server/scripts/migrate-mongo-to-mysql/index.ts). Compares record counts
// and a handful of aggregate financial/stock totals between the two
// databases and fails loudly (non-zero exit) on any mismatch. Read-only
// against both databases.
//
// Usage:
//   MONGODB_URI='mongodb://...' DATABASE_URL='mysql://...' \
//     npm run migrate:validate
import { MongoClient } from 'mongodb';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/config/db';
import { MongoOrder, MongoProduct } from './types';

interface Comparison {
  name: string;
  mongo: number;
  mysql: number;
}

const comparisons: Comparison[] = [];

function compare(name: string, mongoValue: number, mysqlValue: number) {
  comparisons.push({ name, mongo: mongoValue, mysql: mysqlValue });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[migrate:validate] MONGODB_URI is required.');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();
  await connectDatabase();

  // Counts
  compare('users', await db.collection('users').countDocuments(), await prisma.user.count());
  compare(
    'admins (ADMIN + SUPER_ADMIN)',
    await db.collection('users').countDocuments({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }),
    await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } })
  );
  compare(
    'customers',
    await db.collection('users').countDocuments({ role: 'CUSTOMER' }),
    await prisma.user.count({ where: { role: 'CUSTOMER' } })
  );
  compare('addresses', await db.collection('addresses').countDocuments(), await prisma.address.count());
  compare('categories', await db.collection('categories').countDocuments(), await prisma.category.count());
  compare('products', await db.collection('products').countDocuments(), await prisma.product.count());
  compare('coupons', await db.collection('coupons').countDocuments(), await prisma.coupon.count());
  compare('reviews', await db.collection('reviews').countDocuments(), await prisma.review.count());
  compare('orders', await db.collection('orders').countDocuments(), await prisma.order.count());
  compare('payment intents', await db.collection('paymentintents').countDocuments(), await prisma.paymentIntent.count());
  compare('blog posts', await db.collection('blogposts').countDocuments(), await prisma.blogPost.count());
  compare('newsletter subscribers', await db.collection('newslettersubscribers').countDocuments(), await prisma.newsletterSubscriber.count());
  compare('bulk order inquiries', await db.collection('bulkorderinquiries').countDocuments(), await prisma.bulkOrderInquiry.count());

  const mongoVariantCount = await db
    .collection<MongoProduct>('products')
    .aggregate([{ $project: { count: { $size: { $ifNull: ['$variants', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }])
    .toArray();
  compare('product variants', mongoVariantCount[0]?.total ?? 0, await prisma.productVariant.count());

  // Stock and price totals — catches silent unit/rounding/decimal errors
  // that a plain count comparison would miss.
  const mongoProducts = await db.collection<MongoProduct>('products').find({}).toArray();
  const mongoTotalStock = mongoProducts.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const mongoTotalMrp = round2(mongoProducts.reduce((sum, p) => sum + p.mrp, 0));

  const mysqlStockAgg = await prisma.product.aggregate({ _sum: { stock: true, mrp: true } });
  compare('total product base stock', mongoTotalStock, mysqlStockAgg._sum.stock ?? 0);
  compare('total product MRP (sum)', mongoTotalMrp, round2(Number(mysqlStockAgg._sum.mrp ?? 0)));

  // Order financial totals.
  const mongoOrders = await db.collection<MongoOrder>('orders').find({}).toArray();
  const mongoGrandTotal = round2(mongoOrders.reduce((sum, o) => sum + o.grandTotal, 0));
  const mysqlOrderAgg = await prisma.order.aggregate({ _sum: { grandTotal: true } });
  compare('order grand total (sum)', mongoGrandTotal, round2(Number(mysqlOrderAgg._sum.grandTotal ?? 0)));

  // PaymentIntent status breakdown.
  for (const status of ['CREATED', 'PROCESSING', 'PAID', 'FAILED', 'REQUIRES_REFUND'] as const) {
    compare(
      `payment intents: ${status}`,
      await db.collection('paymentintents').countDocuments({ status }),
      await prisma.paymentIntent.count({ where: { status } })
    );
  }

  await client.close();
  await disconnectDatabase();

  console.log('\nMongo -> MySQL migration validation report');
  console.log('=============================================');
  let mismatches = 0;
  for (const c of comparisons) {
    const ok = c.mongo === c.mysql;
    if (!ok) mismatches += 1;
    console.log(`[${ok ? 'MATCH' : 'MISMATCH'}] ${c.name}: mongo=${c.mongo} mysql=${c.mysql}`);
  }
  console.log('=============================================');
  console.log(mismatches === 0 ? 'All checks match.' : `${mismatches} mismatch(es) found — investigate before decommissioning Mongo.`);

  process.exit(mismatches === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error('[migrate:validate] Failed:', error);
  process.exit(1);
});
