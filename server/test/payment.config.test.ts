import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../src/services/payment.service', () => ({}));

async function buildApp() {
  const { razorpayConfigHandler } = await import('../src/controllers/payment.controller');
  const app = express();
  app.get('/config', razorpayConfigHandler);
  return app;
}

describe('Razorpay configuration endpoint', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reports disabled without exposing credentials when keys are absent', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const app = await buildApp();

    const res = await request(app).get('/config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { enabled: false }, message: 'Success' });
    expect(JSON.stringify(res.body)).not.toMatch(/RAZORPAY|secret|key/i);
  });

  it('automatically reports enabled when both runtime keys are configured', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    const app = await buildApp();

    const res = await request(app).get('/config');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ enabled: true });
  });
});
