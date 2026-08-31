import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'node:crypto';

const WEBHOOK_SECRET = 'whsec_test_123';

vi.mock('../src/repositories/payment.repository', () => ({
  processWebhookEvent: vi.fn(async () => {}),
}));

function sign(body: string): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

async function buildApp() {
  const { razorpayWebhookHandler } = await import('../src/controllers/payment.controller');
  const app = express();
  app.use('/webhook', express.raw({ type: 'application/json' }), razorpayWebhookHandler);
  return app;
}

describe('razorpay webhook signature verification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // env.ts fails fast on a partial Razorpay configuration — all three
    // vars (or none) must be set for `env` to even be importable.
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it('accepts a payload with a valid signature and forwards it for processing', async () => {
    const app = await buildApp();
    const paymentService = await import('../src/repositories/payment.repository');
    const body = JSON.stringify({ event: 'order.paid', payload: {} });

    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', sign(body))
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(paymentService.processWebhookEvent).toHaveBeenCalledTimes(1);
  });

  it('rejects a payload with an invalid signature and does not process it', async () => {
    const app = await buildApp();
    const paymentService = await import('../src/repositories/payment.repository');
    const body = JSON.stringify({ event: 'order.paid', payload: {} });

    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', 'a'.repeat(64))
      .send(body);

    expect(res.status).toBe(400);
    expect(paymentService.processWebhookEvent).not.toHaveBeenCalled();
  });

  it('rejects a payload with a tampered body even if the signature was valid for the original body', async () => {
    const app = await buildApp();
    const paymentService = await import('../src/repositories/payment.repository');
    const originalBody = JSON.stringify({ event: 'order.paid', payload: {} });
    const signature = sign(originalBody);
    const tamperedBody = JSON.stringify({ event: 'order.paid', payload: { tampered: true } });

    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', signature)
      .send(tamperedBody);

    expect(res.status).toBe(400);
    expect(paymentService.processWebhookEvent).not.toHaveBeenCalled();
  });

  it('rejects a request with no signature header', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(400);
  });

  it('returns 503 when the webhook secret is not configured', async () => {
    // 0-of-3 Razorpay vars set is the other valid state (COD-only) besides
    // all-3 — this is the realistic way a deployment ends up with no
    // webhook secret configured.
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const app = await buildApp();
    const body = JSON.stringify({ event: 'order.paid', payload: {} });

    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', 'irrelevant')
      .send(body);

    expect(res.status).toBe(503);
  });
});
