import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('razorpay utils', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('converts rupees to paise safely, rounding fractional paise', async () => {
    const { toPaise } = await import('../src/utils/razorpay');
    expect(toPaise(499)).toBe(49900);
    expect(toPaise(499.5)).toBe(49950);
    expect(toPaise(10.005)).toBe(1001); // rounds instead of truncating/floating-point drifting
  });

  it('reports not configured when Razorpay env vars are missing', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const { isRazorpayConfigured } = await import('../src/utils/razorpay');
    expect(isRazorpayConfigured()).toBe(false);
  });

  it('reports configured when both key id and secret are present', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'secret123';
    const { isRazorpayConfigured } = await import('../src/utils/razorpay');
    expect(isRazorpayConfigured()).toBe(true);
  });

  it('throws a clear error when creating a client without configuration', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const { getRazorpayClient } = await import('../src/utils/razorpay');
    expect(() => getRazorpayClient()).toThrow(/not configured/i);
  });

  it('computes a matching HMAC-SHA256 hex digest for identical input', async () => {
    const { computeHmacSha256Hex } = await import('../src/utils/razorpay');
    const a = computeHmacSha256Hex('secret', 'order_1|pay_1');
    const b = computeHmacSha256Hex('secret', 'order_1|pay_1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different digests for different secrets', async () => {
    const { computeHmacSha256Hex } = await import('../src/utils/razorpay');
    const a = computeHmacSha256Hex('secret-a', 'order_1|pay_1');
    const b = computeHmacSha256Hex('secret-b', 'order_1|pay_1');
    expect(a).not.toBe(b);
  });

  describe('timingSafeEqualHex', () => {
    it('accepts a correct matching signature', async () => {
      const { timingSafeEqualHex, computeHmacSha256Hex } = await import('../src/utils/razorpay');
      const digest = computeHmacSha256Hex('secret', 'payload');
      expect(timingSafeEqualHex(digest, digest)).toBe(true);
    });

    it('rejects a tampered signature', async () => {
      const { timingSafeEqualHex, computeHmacSha256Hex } = await import('../src/utils/razorpay');
      const digest = computeHmacSha256Hex('secret', 'payload');
      const tampered = `${digest.slice(0, -1)}${digest.at(-1) === 'a' ? 'b' : 'a'}`;
      expect(timingSafeEqualHex(digest, tampered)).toBe(false);
    });

    it('rejects non-hex or malformed input without throwing', async () => {
      const { timingSafeEqualHex } = await import('../src/utils/razorpay');
      expect(timingSafeEqualHex('not-hex', 'also-not-hex')).toBe(false);
      expect(timingSafeEqualHex('', '')).toBe(false);
    });
  });
});
