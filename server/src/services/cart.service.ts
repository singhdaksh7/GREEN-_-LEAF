import { Cart, ICart } from '../models/Cart';
import { Product } from '../models/Product';
import { SiteSettings } from '../models/SiteSettings';
import { ApiError } from '../utils/ApiError';
import { resolveProductPrice, computeShipping } from './pricing.service';

export async function getOrCreateCart(userId: string): Promise<ICart> {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

export async function addItemToCart(userId: string, productId: string, variantSku: string | null, quantity: number): Promise<ICart> {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');

  const resolved = resolveProductPrice(product, variantSku);
  if (resolved.stock < quantity) throw ApiError.badRequest('Insufficient stock for this item');

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.product.toString() === productId && item.variantSku === variantSku);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: product._id, variantSku, quantity } as never);
  }

  await cart.save();
  return cart;
}

export async function updateCartItem(userId: string, productId: string, variantSku: string | null, quantity: number): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.product.toString() === productId && i.variantSku === variantSku);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => !(i.product.toString() === productId && i.variantSku === variantSku));
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  return cart;
}

export async function removeCartItem(userId: string, productId: string, variantSku: string | null): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => !(i.product.toString() === productId && i.variantSku === variantSku));
  await cart.save();
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  await Cart.findOneAndUpdate({ user: userId }, { items: [] });
}

export async function priceCart(cart: ICart) {
  const settings = await SiteSettings.findOne({ key: 'default' }).lean();
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 999;
  const standardShippingFee = settings?.standardShippingFee ?? 79;

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lines = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());
    if (!product) throw ApiError.badRequest('One of the items in your cart is no longer available');
    const resolved = resolveProductPrice(product, item.variantSku);
    return {
      productId: item.product.toString(),
      slug: product.slug,
      variantSku: item.variantSku,
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
