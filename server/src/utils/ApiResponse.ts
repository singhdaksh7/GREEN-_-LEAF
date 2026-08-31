import { Response } from 'express';

interface DecimalLike {
  toNumber: () => number;
}

function isDecimalLike(value: unknown): value is DecimalLike {
  return typeof value === 'object' && value !== null && typeof (value as DecimalLike).toNumber === 'function';
}

/**
 * Every API response payload passes through here before being sent. Two
 * cross-cutting concerns are handled once, centrally, instead of at every
 * individual controller/repository call site:
 *
 * 1. `_id`: Mongoose documents always exposed BOTH `_id` (the real field)
 *    and a virtual `id` getter (a stringified copy), and the frontend was
 *    written against that dual availability inconsistently — most models
 *    (Product, Category, Order, ...) are read via `_id`, but User records
 *    are read via the `id` virtual instead (see client/src/types `User`,
 *    AdminCustomersPage, etc). Prisma only has `id`. Rather than audit
 *    every frontend file to find out which convention it happens to use,
 *    this ADDS `_id` alongside the existing `id` on every object — exactly
 *    mirroring what Mongoose always did — so either convention keeps
 *    working without touching any frontend code as part of this database
 *    migration.
 * 2. Prisma `Decimal` fields (mrp, salePrice, totals, ...) serialize to a
 *    string via their own `toJSON`, but the frontend does real arithmetic
 *    on these fields (discount %, cart totals) expecting a JS number.
 *
 * Date objects are left untouched (JSON.stringify already serializes them
 * to ISO strings, matching the old Mongoose timestamps' behavior).
 */
function transformForClient(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (isDecimalLike(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(transformForClient);

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = transformForClient(val);
      if (key === 'id' && typeof val === 'string') {
        result._id = val;
      }
    }
    return result;
  }

  return value;
}

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data: transformForClient(data), message });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return sendSuccess(res, data, message, 201);
}
