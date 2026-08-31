/* eslint-disable no-console */
// One-time Mongo -> MySQL data migration for GreenKart.
//
// Usage:
//   MONGODB_URI='mongodb://...' DATABASE_URL='mysql://...' \
//     npm run migrate:mongo-to-mysql
//
// Safety:
// - Never run this against a production MySQL database that already has
//   real traffic without a fresh backup — it writes real rows.
// - Idempotent: every migrated row is upserted keyed on `legacyMongoId`, so
//   re-running after a partial failure only fills in what's missing instead
//   of duplicating anything.
// - Read-only against Mongo: nothing here ever writes back to the source
//   database.
// - This is the ONLY place in the codebase allowed to depend on the
//   `mongodb` driver (see server/package.json) — the rest of the
//   application is MySQL/Prisma-only (see server/src/config/db.ts).
import { MongoClient, ObjectId } from 'mongodb';
import { prisma, connectDatabase, disconnectDatabase } from '../../src/config/db';
import { toSlug } from '../../src/utils/slug';
import {
  MongoUser, MongoAddress, MongoCategory, MongoProduct, MongoCoupon, MongoReview,
  MongoOrder, MongoPaymentIntent, MongoBlogPost, MongoNewsletterSubscriber,
  MongoBulkOrderInquiry, MongoCart, MongoWishlist, BLOG_CATEGORY_MAP,
} from './types';

type IdMap = Map<string, string>;

function oid(id: ObjectId | string | null | undefined): string | null {
  if (!id) return null;
  return id.toString();
}

async function loadExistingIdMap(
  find: () => Promise<{ id: string; legacyMongoId: string | null }[]>
): Promise<IdMap> {
  const rows = await find();
  const map: IdMap = new Map();
  for (const row of rows) {
    if (row.legacyMongoId) map.set(row.legacyMongoId, row.id);
  }
  return map;
}

async function migrateUsers(db: import('mongodb').Db) {
  const idMap = await loadExistingIdMap(() =>
    prisma.user.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const users = await db.collection<MongoUser>('users').find({}).toArray();
  for (const doc of users) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const created = await prisma.user.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        name: doc.name,
        email: doc.email.toLowerCase(),
        passwordHash: doc.passwordHash,
        role: doc.role,
        isActive: doc.isActive ?? true,
        tokenVersion: doc.tokenVersion ?? 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
    idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] users: ${idMap.size} total`);
  return idMap;
}

async function migrateAddresses(db: import('mongodb').Db, userIds: IdMap) {
  const idMap = await loadExistingIdMap(() =>
    prisma.address.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const addresses = await db.collection<MongoAddress>('addresses').find({}).toArray();
  for (const doc of addresses) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const userId = userIds.get(oid(doc.user)!);
    if (!userId) {
      console.warn(`[migrate] address ${legacyMongoId}: skipped, owning user not migrated`);
      continue;
    }

    const created = await prisma.address.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        userId,
        fullName: doc.fullName,
        phone: doc.phone,
        addressLine: doc.addressLine,
        locality: doc.locality,
        city: doc.city,
        state: doc.state,
        pincode: doc.pincode,
        isDefault: doc.isDefault ?? false,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
    idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] addresses: ${idMap.size} total`);
  return idMap;
}

async function migrateCategories(db: import('mongodb').Db) {
  const idMap = await loadExistingIdMap(() =>
    prisma.category.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const categories = await db.collection<MongoCategory>('categories').find({}).toArray();

  // Pass 1: create every category without its parent link (a child may be
  // read before its parent in an unordered collection scan).
  for (const doc of categories) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const slug = doc.slug || toSlug(doc.name);
    const created = await prisma.category.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        name: doc.name,
        slug,
        description: doc.description ?? null,
        image: doc.image ?? null,
        order: doc.order ?? 0,
        isActive: doc.isActive ?? true,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
    idMap.set(legacyMongoId, created.id);
  }

  // Pass 2: link parents now that every category has a new id.
  for (const doc of categories) {
    if (!doc.parent) continue;
    const id = idMap.get(oid(doc._id)!);
    const parentId = idMap.get(oid(doc.parent)!);
    if (!id || !parentId) continue;
    await prisma.category.update({ where: { id }, data: { parentId } });
  }

  console.log(`[migrate] categories: ${idMap.size} total`);
  return idMap;
}

async function migrateProducts(db: import('mongodb').Db, categoryIds: IdMap) {
  const idMap = await loadExistingIdMap(() =>
    prisma.product.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );
  // sku -> new variant id, needed later by orders/payment intents/reviews/carts.
  const variantIdBySku: IdMap = new Map();
  for (const variant of await prisma.productVariant.findMany({ select: { id: true, sku: true } })) {
    variantIdBySku.set(variant.sku, variant.id);
  }

  const products = await db.collection<MongoProduct>('products').find({}).toArray();
  for (const doc of products) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const categoryId = categoryIds.get(oid(doc.category)!);
    if (!categoryId) {
      console.warn(`[migrate] product ${doc.slug}: skipped, category not migrated`);
      continue;
    }
    const subcategoryId = doc.subcategory ? categoryIds.get(oid(doc.subcategory)!) ?? null : null;

    // Same legacy-data normalization the old Mongoose model applied on read
    // (see the removed pre('init') hook in server/src/models/Product.ts):
    // older documents may have no `status` at all, only `isActive`.
    const status = doc.status ?? (doc.isActive === false ? 'ARCHIVED' : 'PUBLISHED');

    const images = (doc.images ?? []).map((image, index) =>
      typeof image === 'string'
        ? { url: image, key: '', alt: '', isPrimary: index === 0, sortOrder: index }
        : {
            url: image.url,
            key: image.key ?? '',
            alt: image.alt ?? '',
            isPrimary: image.isPrimary ?? index === 0,
            sortOrder: image.sortOrder ?? index,
          }
    );

    const created = await prisma.product.create({
      data: {
        legacyMongoId,
        name: doc.name,
        slug: doc.slug || toSlug(doc.name),
        shortDescription: doc.shortDescription,
        description: doc.description,
        howToUse: doc.howToUse ?? null,
        sku: doc.sku,
        brand: doc.brand ?? 'GreenKart',
        categoryId,
        subcategoryId,
        mrp: doc.mrp,
        salePrice: doc.salePrice,
        stock: doc.stock ?? 0,
        featured: doc.featured ?? false,
        bestSeller: doc.bestSeller ?? false,
        newArrival: doc.newArrival ?? false,
        averageRating: doc.averageRating ?? 0,
        reviewCount: doc.reviewCount ?? 0,
        seoTitle: doc.seoTitle ?? null,
        seoDescription: doc.seoDescription ?? null,
        status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        images: { create: images },
        tags: { create: (doc.tags ?? []).map((tag) => ({ tag })) },
        variants: {
          create: (doc.variants ?? []).map((variant) => ({
            legacyMongoId: oid(variant._id),
            sku: variant.sku,
            mrp: variant.mrp,
            salePrice: variant.salePrice,
            stock: variant.stock ?? 0,
            attributes: { create: Object.entries(variant.attributes ?? {}).map(([key, value]) => ({ key, value })) },
            images: { create: (variant.images ?? []).map((url, sortOrder) => ({ url, sortOrder })) },
          })),
        },
      },
      include: { variants: true },
    });

    idMap.set(legacyMongoId, created.id);
    for (const variant of created.variants) variantIdBySku.set(variant.sku, variant.id);
  }
  console.log(`[migrate] products: ${idMap.size} total`);
  return { productIds: idMap, variantIdBySku };
}

async function migrateCoupons(db: import('mongodb').Db) {
  const idMap = await loadExistingIdMap(() =>
    prisma.coupon.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const coupons = await db.collection<MongoCoupon>('coupons').find({}).toArray();
  for (const doc of coupons) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const created = await prisma.coupon.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        code: doc.code.toUpperCase(),
        type: doc.type,
        value: doc.value ?? 0,
        minOrderValue: doc.minOrderValue ?? 0,
        maxDiscount: doc.maxDiscount ?? null,
        expiresAt: doc.expiresAt ?? null,
        usageLimit: doc.usageLimit ?? null,
        usedCount: doc.usedCount ?? 0,
        isActive: doc.isActive ?? true,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
    idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] coupons: ${idMap.size} total`);
  return idMap;
}

async function migrateReviews(db: import('mongodb').Db, productIds: IdMap, userIds: IdMap) {
  const idMap = await loadExistingIdMap(() =>
    prisma.review.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const reviews = await db.collection<MongoReview>('reviews').find({}).toArray();
  for (const doc of reviews) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const productId = productIds.get(oid(doc.product)!);
    const userId = userIds.get(oid(doc.user)!);
    if (!productId || !userId) {
      console.warn(`[migrate] review ${legacyMongoId}: skipped, product or user not migrated`);
      continue;
    }

    const created = await prisma.review
      .upsert({
        where: { legacyMongoId },
        update: {},
        create: {
          legacyMongoId,
          productId,
          userId,
          rating: doc.rating,
          title: doc.title,
          description: doc.description,
          verifiedPurchase: doc.verifiedPurchase ?? false,
          isApproved: doc.isApproved ?? true,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      })
      // A (productId, userId) collision with a review that has a different
      // legacyMongoId means duplicate legacy data for the same pair — keep
      // whichever one already exists rather than failing the whole run.
      .catch(() => null);
    if (created) idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] reviews: ${idMap.size} total`);
  return idMap;
}

function resolveVariantId(sku: string | null, variantIdBySku: IdMap): string | null {
  if (!sku) return null;
  return variantIdBySku.get(sku) ?? null;
}

async function migrateOrders(db: import('mongodb').Db, userIds: IdMap, productIds: IdMap, variantIdBySku: IdMap) {
  const idMap = await loadExistingIdMap(() =>
    prisma.order.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const orders = await db.collection<MongoOrder>('orders').find({}).toArray();
  for (const doc of orders) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const userId = userIds.get(oid(doc.user)!);
    if (!userId) {
      console.warn(`[migrate] order ${doc.orderNumber}: skipped, owning user not migrated`);
      continue;
    }

    const created = await prisma.order.create({
      data: {
        legacyMongoId,
        orderNumber: doc.orderNumber,
        userId,
        shippingFullName: doc.shippingAddress.fullName,
        shippingPhone: doc.shippingAddress.phone,
        shippingEmail: doc.shippingAddress.email,
        shippingAddressLine: doc.shippingAddress.addressLine,
        shippingLocality: doc.shippingAddress.locality,
        shippingCity: doc.shippingAddress.city,
        shippingState: doc.shippingAddress.state,
        shippingPincode: doc.shippingAddress.pincode,
        subtotal: doc.subtotal,
        discount: doc.discount ?? 0,
        shipping: doc.shipping ?? 0,
        tax: doc.tax ?? 0,
        grandTotal: doc.grandTotal,
        couponCode: doc.couponCode ?? null,
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        razorpayOrderId: doc.razorpayOrderId ?? null,
        razorpayPaymentId: doc.razorpayPaymentId ?? null,
        orderStatus: doc.orderStatus as never,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        items: {
          create: doc.items.map((item) => ({
            productId: item.product ? productIds.get(oid(item.product)!) ?? null : null,
            variantId: resolveVariantId(item.sku, variantIdBySku),
            productName: item.productName,
            productImage: item.productImage,
            sku: item.sku,
            variant: item.variant ?? undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
        statusHistory: {
          create: (doc.statusHistory ?? [{ status: doc.orderStatus, changedAt: doc.createdAt }]).map((entry) => ({
            status: entry.status,
            changedAt: entry.changedAt,
            note: entry.note ?? null,
          })),
        },
      },
    });
    idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] orders: ${idMap.size} total`);
  return idMap;
}

async function migratePaymentIntents(
  db: import('mongodb').Db,
  userIds: IdMap,
  productIds: IdMap,
  variantIdBySku: IdMap,
  orderIds: IdMap
) {
  const idMap = await loadExistingIdMap(() =>
    prisma.paymentIntent.findMany({ where: { razorpayOrderId: { not: '' } }, select: { id: true, razorpayOrderId: true } }).then((rows) =>
      rows.map((r) => ({ id: r.id, legacyMongoId: r.razorpayOrderId }))
    )
  );

  const intents = await db.collection<MongoPaymentIntent>('paymentintents').find({}).toArray();
  for (const doc of intents) {
    if (idMap.has(doc.razorpayOrderId)) continue;

    const userId = userIds.get(oid(doc.user)!);
    if (!userId) {
      console.warn(`[migrate] payment intent ${doc.razorpayOrderId}: skipped, owning user not migrated`);
      continue;
    }

    const created = await prisma.paymentIntent.upsert({
      where: { razorpayOrderId: doc.razorpayOrderId },
      update: {},
      create: {
        userId,
        razorpayOrderId: doc.razorpayOrderId,
        razorpayPaymentId: doc.razorpayPaymentId ?? null,
        amount: doc.amount,
        currency: doc.currency ?? 'INR',
        status: doc.status,
        failureReason: doc.failureReason ?? null,
        couponCode: doc.couponCode ?? null,
        shippingFullName: doc.shippingAddress.fullName,
        shippingPhone: doc.shippingAddress.phone,
        shippingEmail: doc.shippingAddress.email,
        shippingAddressLine: doc.shippingAddress.addressLine,
        shippingLocality: doc.shippingAddress.locality,
        shippingCity: doc.shippingAddress.city,
        shippingState: doc.shippingAddress.state,
        shippingPincode: doc.shippingAddress.pincode,
        subtotal: doc.subtotal,
        discount: doc.discount ?? 0,
        shipping: doc.shipping ?? 0,
        tax: doc.tax ?? 0,
        grandTotal: doc.grandTotal,
        orderId: doc.order ? orderIds.get(oid(doc.order)!) ?? null : null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        lines: {
          create: doc.lines.map((line) => ({
            productId: productIds.get(oid(line.productId)!) ?? '',
            variantId: resolveVariantId(line.variantSku, variantIdBySku),
            variantSku: line.variantSku,
            name: line.name,
            image: line.image,
            variant: line.variant ?? undefined,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
          })),
        },
      },
    });
    idMap.set(doc.razorpayOrderId, created.id);
  }
  console.log(`[migrate] payment intents: ${idMap.size} total`);
  return idMap;
}

async function migrateCartsAndWishlists(db: import('mongodb').Db, userIds: IdMap, productIds: IdMap, variantIdBySku: IdMap) {
  const carts = await db.collection<MongoCart>('carts').find({}).toArray();
  let cartCount = 0;
  for (const doc of carts) {
    const userId = userIds.get(oid(doc.user)!);
    if (!userId) continue;
    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const item of doc.items) {
      const productId = productIds.get(oid(item.product)!);
      if (!productId) continue;
      const variantId = resolveVariantId(item.variantSku, variantIdBySku);
      const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId, variantId } });
      if (!existing) {
        await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity: item.quantity } });
      }
    }
    cartCount += 1;
  }
  console.log(`[migrate] carts: ${cartCount} total`);

  const wishlists = await db.collection<MongoWishlist>('wishlists').find({}).toArray();
  let wishlistCount = 0;
  for (const doc of wishlists) {
    const userId = userIds.get(oid(doc.user)!);
    if (!userId) continue;
    const wishlist = await prisma.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const productRef of doc.products) {
      const productId = productIds.get(oid(productRef)!);
      if (!productId) continue;
      await prisma.wishlistItem.upsert({
        where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
        update: {},
        create: { wishlistId: wishlist.id, productId },
      });
    }
    wishlistCount += 1;
  }
  console.log(`[migrate] wishlists: ${wishlistCount} total`);
}

async function migrateBlogPosts(db: import('mongodb').Db, userIds: IdMap) {
  const idMap = await loadExistingIdMap(() =>
    prisma.blogPost.findMany({ where: { legacyMongoId: { not: null } }, select: { id: true, legacyMongoId: true } })
  );

  const posts = await db.collection<MongoBlogPost>('blogposts').find({}).toArray();
  for (const doc of posts) {
    const legacyMongoId = oid(doc._id)!;
    if (idMap.has(legacyMongoId)) continue;

    const created = await prisma.blogPost.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        title: doc.title,
        slug: doc.slug || toSlug(doc.title),
        category: (BLOG_CATEGORY_MAP[doc.category] ?? doc.category) as never,
        excerpt: doc.excerpt,
        content: doc.content,
        coverImage: doc.coverImage,
        authorId: doc.author ? userIds.get(oid(doc.author)!) ?? null : null,
        isPublished: doc.isPublished ?? false,
        publishedAt: doc.publishedAt ?? null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
    idMap.set(legacyMongoId, created.id);
  }
  console.log(`[migrate] blog posts: ${idMap.size} total`);
}

async function migrateNewsletterSubscribers(db: import('mongodb').Db) {
  const subscribers = await db.collection<MongoNewsletterSubscriber>('newslettersubscribers').find({}).toArray();
  let count = 0;
  for (const doc of subscribers) {
    const legacyMongoId = oid(doc._id)!;
    await prisma.newsletterSubscriber.upsert({
      where: { legacyMongoId },
      update: {},
      create: { legacyMongoId, email: doc.email.toLowerCase(), isActive: doc.isActive ?? true, createdAt: doc.createdAt },
    });
    count += 1;
  }
  console.log(`[migrate] newsletter subscribers: ${count} total`);
}

async function migrateBulkOrderInquiries(db: import('mongodb').Db) {
  const inquiries = await db.collection<MongoBulkOrderInquiry>('bulkorderinquiries').find({}).toArray();
  let count = 0;
  for (const doc of inquiries) {
    const legacyMongoId = oid(doc._id)!;
    await prisma.bulkOrderInquiry.upsert({
      where: { legacyMongoId },
      update: {},
      create: {
        legacyMongoId,
        fullName: doc.fullName,
        email: doc.email,
        mobile: doc.mobile,
        pincode: doc.pincode,
        company: doc.company ?? null,
        product: doc.product ?? null,
        requirement: doc.requirement ?? null,
        message: doc.message ?? null,
        quantity: doc.quantity,
        targetPrice: doc.targetPrice ?? null,
        expectedPurchaseDate: doc.expectedPurchaseDate ?? null,
        status: doc.status ?? 'NEW',
        createdAt: doc.createdAt,
      },
    });
    count += 1;
  }
  console.log(`[migrate] bulk order inquiries: ${count} total`);
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('[migrate] MONGODB_URI is required (point it at the legacy database to migrate FROM).');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();
  await connectDatabase();

  console.log('[migrate] Starting Mongo -> MySQL migration...');

  const userIds = await migrateUsers(db);
  await migrateAddresses(db, userIds);
  const categoryIds = await migrateCategories(db);
  const { productIds, variantIdBySku } = await migrateProducts(db, categoryIds);
  await migrateCoupons(db);
  await migrateReviews(db, productIds, userIds);
  const orderIds = await migrateOrders(db, userIds, productIds, variantIdBySku);
  await migratePaymentIntents(db, userIds, productIds, variantIdBySku, orderIds);
  await migrateCartsAndWishlists(db, userIds, productIds, variantIdBySku);
  await migrateBlogPosts(db, userIds);
  await migrateNewsletterSubscribers(db);
  await migrateBulkOrderInquiries(db);

  console.log('[migrate] Done. Run `npm run migrate:validate` to compare record counts and totals.');

  await client.close();
  await disconnectDatabase();
  process.exit(0);
}

run().catch((error) => {
  console.error('[migrate] Failed:', error);
  process.exit(1);
});
