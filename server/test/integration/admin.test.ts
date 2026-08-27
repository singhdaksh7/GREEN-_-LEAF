import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createUser, authHeaderFor, createCategory, createProduct } from '../helpers/factories';
import { Product } from '../../src/models/Product';

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

describe('admin authorization', () => {
  it('rejects a non-admin customer', async () => {
    const customer = await createUser({ role: 'CUSTOMER' });
    const res = await request(app).get('/api/admin/products').set('Authorization', authHeaderFor(customer));
    expect(res.status).toBe(403);
  });

  it('accepts an admin user', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const res = await request(app).get('/api/admin/products').set('Authorization', authHeaderFor(admin));
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/admin/products/:id', () => {
  it('rejects a malformed payload (wrong type / unknown field)', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const product = await createProduct(category.id);

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ mrp: 'not-a-number' });
    expect(res.status).toBe(400);

    const res2 = await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ notAllowedField: 'value' });
    expect(res2.status).toBe(400);
  });

  it('accepts a valid partial payload', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 10 });

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ stock: 25 });

    expect(res.status).toBe(200);
    expect(res.body.data.stock).toBe(25);
  });

  it('does not wipe existing variants or tags when editing unrelated fields', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const product = await createProduct(category.id, {
      tags: ['bestseller', 'indoor'],
      variants: [
        { sku: 'VAR-1', attributes: { size: 'Large' }, mrp: 600, salePrice: 500, stock: 4, images: [] },
      ],
    });

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ name: 'Renamed Ceramic Pot' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Ceramic Pot');
    expect(res.body.data.tags).toEqual(['bestseller', 'indoor']);
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0].sku).toBe('VAR-1');

    const persisted = await Product.findById(product.id);
    expect(persisted!.tags).toEqual(['bestseller', 'indoor']);
    expect(persisted!.variants).toHaveLength(1);
  });
});
