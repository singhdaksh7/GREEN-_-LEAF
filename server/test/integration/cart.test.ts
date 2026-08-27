import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createUser, authHeaderFor, createCategory, createProduct } from '../helpers/factories';

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

describe('cart', () => {
  it('adds an item to the cart', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 5 });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeaderFor(user))
      .send({ productId: product.id, quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.lines).toHaveLength(1);
    expect(res.body.data.lines[0].quantity).toBe(2);
  });

  it('updates the quantity of an existing cart item', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 5 });

    await request(app).post('/api/cart/items').set('Authorization', authHeaderFor(user)).send({ productId: product.id, quantity: 1 });
    const res = await request(app)
      .patch('/api/cart/items')
      .set('Authorization', authHeaderFor(user))
      .send({ productId: product.id, quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.lines[0].quantity).toBe(3);
  });

  it('removes an item from the cart', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 5 });

    await request(app).post('/api/cart/items').set('Authorization', authHeaderFor(user)).send({ productId: product.id, quantity: 1 });
    const res = await request(app)
      .delete(`/api/cart/items/${product.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(res.status).toBe(200);
    expect(res.body.data.lines).toHaveLength(0);
  });

  it('rejects adding more than the available stock', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 2 });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeaderFor(user))
      .send({ productId: product.id, quantity: 5 });

    expect(res.status).toBe(400);
  });
});
