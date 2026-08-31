import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

const WISHLIST_INCLUDE = {
  items: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' as const }, take: 1 } } } } },
} satisfies Prisma.WishlistInclude;

export async function getOrCreateWishlist(userId: string) {
  return prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: WISHLIST_INCLUDE,
  });
}

export async function addToWishlist(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    update: {},
    create: { wishlistId: wishlist.id, productId },
  });
  return getOrCreateWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await prisma.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  return getOrCreateWishlist(userId);
}
