import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { PricedLine } from './cart.repository';

type TxClient = Prisma.TransactionClient;

/**
 * Decrements stock for every line inside an already-open transaction,
 * conditioned on sufficient stock still being available at write time —
 * protects against concurrent checkouts that both passed an earlier
 * read-only stock check. Each conditional UPDATE's affected-row count (not
 * the earlier read) is what proves the decrement actually applied.
 */
type StockLine = Pick<PricedLine, 'productId' | 'variantId' | 'quantity' | 'name'>;

export async function decrementStockForLines(tx: TxClient, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      const result = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (result.count === 0) throw ApiError.badRequest(`Insufficient stock for ${line.name}`);
    } else {
      const result = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (result.count === 0) throw ApiError.badRequest(`Insufficient stock for ${line.name}`);
    }
  }
}

/**
 * Atomically reserves one use of a coupon inside an already-open
 * transaction: the UPDATE's WHERE clause (isActive + usedCount below the
 * limit read moments earlier) is re-evaluated by MySQL against the current
 * row at execution time under its row lock, so two concurrent checkouts
 * racing for the last remaining use can never both win.
 */
export async function reserveCoupon(tx: TxClient, couponCode: string): Promise<void> {
  const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon) throw ApiError.badRequest('This coupon is no longer valid');

  const usageCondition = coupon.usageLimit === null ? {} : { usedCount: { lt: coupon.usageLimit } };
  const result = await tx.coupon.updateMany({
    where: { code: couponCode, isActive: true, ...usageCondition },
    data: { usedCount: { increment: 1 } },
  });
  if (result.count === 0) {
    throw ApiError.badRequest('This coupon has just reached its usage limit. Please remove it and try again.');
  }
}
