import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';
import { ApiError } from './ApiError';

let client: Razorpay | null = null;

export function isRazorpayConfigured(): boolean {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw ApiError.serviceUnavailable('Online payments are not available yet');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  }
  return client;
}

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const HEX_64 = /^[a-f0-9]{64}$/i;

export function timingSafeEqualHex(expectedHex: string, providedHex: string): boolean {
  if (!HEX_64.test(expectedHex) || !HEX_64.test(providedHex)) return false;
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const providedBuf = Buffer.from(providedHex, 'hex');
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function computeHmacSha256Hex(secret: string, payload: string | Buffer): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
