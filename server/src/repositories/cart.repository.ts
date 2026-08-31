import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { resolveProductPrice, computeShipping } from '../services/pricing.service';
import * as productRepository from './product.repository';
import * as settingsRepository from './settings.repository';

type TxClient = Prisma.TransactionClient;

const CART_INCLUDE = { items: true } satisfies Prisma.CartInclude;
type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: CART_INCLUDE,
  });
}

async function resolveVariantId(productId: string, variantSku: string | null): Promise<string | null> {
  if (!variantSku) return null;
  const variant = await prisma.productVariant.findUnique({ where: { sku: variantSku } });
  if (!variant || variant.productId !== productId) {
    throw ApiError.badRequest(`Variant ${variantSku} not found for this product`);
  }
  return variant.id;
}

export async function addItemToCart(userId: string, productId: string, variantSku: string | null, quantity: number): Promise<CartWithItems> {
  const product = await productRepository.findProductById(productId);
  if (!product || product.status !== 'PUBLISHED') throw ApiError.notFound('Product not found');

  const resolved = resolveProductPrice(product, variantSku);
  if (resolved.stock < quantity) throw ApiError.badRequest('Insufficient stock for this item');

  const variantId = await resolveVariantId(productId, variantSku);
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.productId === productId && item.variantId === variantId);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
  }

  return getOrCreateCart(userId);
}

export async function updateCartItem(userId: string, productId: string, variantSku: string | null, quantity: number): Promise<CartWithItems> {
  const variantId = await resolveVariantId(productId, variantSku);
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.productId === productId && i.variantId === variantId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  return getOrCreateCart(userId);
}

export async function removeCartItem(userId: string, productId: string, variantSku: string | null): Promise<CartWithItems> {
  const variantId = await resolveVariantId(productId, variantSku);
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.productId === productId && i.variantId === variantId);
  if (item) await prisma.cartItem.delete({ where: { id: item.id } });

  return getOrCreateCart(userId);
}

export async function clearCart(userId: string, tx: TxClient | typeof prisma = prisma): Promise<void> {
  const cart = await tx.cart.findUnique({ where: { userId } });
  if (!cart) return;
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export interface PricedLine {
  productId: string;
  slug: string;
  variantId: string | null;
  variantSku: string | null;
  sku: string;
  name: string;
  image: string;
  variant: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  totalPrice: number;
  stock: number;
  inStock: boolean;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  shipping: number;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
}

export async function priceCart(cart: CartWithItems): Promise<PricedCart> {
  const settings = await settingsRepository.getSettings();
  const freeShippingThreshold = settings.freeShippingThreshold;
  const standardShippingFee = settings.standardShippingFee;

  const productIds = [...new Set(cart.items.map((i) => i.productId))];
  const products = await Promise.all(productIds.map((id) => productRepository.findProductById(id)));
  const productMap = new Map(products.filter((p): p is NonNullable<typeof p> => p !== null).map((p) => [p.id, p]));

  const lines: PricedLine[] = cart.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw ApiError.badRequest('One of the items in your cart is no longer available');
    const variantSku = item.variantId ? (product.variants.find((v) => v.id === item.variantId)?.sku ?? null) : null;
    const resolved = resolveProductPrice(product, variantSku);
    return {
      productId: item.productId,
      slug: product.slug,
      variantId: item.variantId,
      variantSku,
      sku: resolved.sku,
      name: resolved.productName,
      image: resolved.productImage,
      variant: resolved.variant,
      quantity: item.quantity,
      unitPrice: resolved.unitPrice,
      mrp: resolved.mrp,
      totalPrice: resolved.unitPrice * item.quantity,
      stock: resolved.stock,
      inStock: resolved.stock >= item.quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  const shipping = computeShipping(subtotal, freeShippingThreshold, standardShippingFee);

  return {
    lines,
    subtotal,
    shipping,
    freeShippingThreshold,
    amountToFreeShipping: Math.max(0, freeShippingThreshold - subtotal),
  };
}
