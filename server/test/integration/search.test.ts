import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createCategory, createProduct } from '../helpers/factories';

const app = createApp();

beforeAll(async () => {
  await setupTestDb();
}, 120000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('GET /api/products', () => {
  it('lists active products', async () => {
    const category = await createCategory();
    await createProduct(category.id, { name: 'Snake Plant' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBe(1);
  });

  it('retrieves a single product by slug', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id, { name: 'Snake Plant' });

    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe('Snake Plant');
  });
});

describe('GET /api/search/suggest (regex safety)', () => {
  it('returns normal matches for a plain query', async () => {
    const category = await createCategory();
    await createProduct(category.id, { name: 'Snake Plant' });

    const res = await request(app).get('/api/search/suggest').query({ q: 'snake' });
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBe(1);
  });

  it('treats regex metacharacters as literal text instead of a pattern', async () => {
    const category = await createCategory();
    await createProduct(category.id, { name: 'Snake Plant' });

    const res = await request(app).get('/api/search/suggest').query({ q: 'snake.*plant' });
    expect(res.status).toBe(200);
    // '.*' is escaped, so this literal string should not match "Snake Plant".
    expect(res.body.data.products.length).toBe(0);
  });

  it('does not hang or error on a classic ReDoS-shaped payload', async () => {
    const category = await createCategory();
    await createProduct(category.id, { name: 'Snake Plant' });

    const pathological = `${'a'.repeat(20)}!`;
    const evilPattern = `(${'a?'.repeat(20)}${'a'.repeat(20)})`;

    const started = Date.now();
    const res = await request(app).get('/api/search/suggest').query({ q: evilPattern });
    const res2 = await request(app).get('/api/search/suggest').query({ q: pathological });
    const elapsed = Date.now() - started;

    expect(res.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  it('rejects unescaped bracket input gracefully rather than throwing a regex syntax error', async () => {
    const res = await request(app).get('/api/search/suggest').query({ q: '[unterminated' });
    expect(res.status).toBe(200);
  });
});
