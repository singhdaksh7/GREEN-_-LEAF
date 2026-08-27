import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createUser, authHeaderFor, createCategory, createProduct, createCoupon } from '../helpers/factories';
import { Product } from '../../src/models/Product';
import { Coupon } from '../../src/models/Coupon';

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

const address = {
  fullName: 'Ada Lovelace',
  phone: '9876543210',
  email: 'ada@example.com',
  addressLine: '221B Baker Street',
  locality: 'Downtown',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

async function addToCart(token: string, productId: string, quantity = 1) {
  return request(app).post('/api/cart/items').set('Authorization', token).send({ productId, quantity });
}

describe('checkout / order creation', () => {
  it('places a successful COD order with correct pricing and stock decrement', async () => {
    const user = await createUser();
    const token = authHeaderFor(user);
    const category = await createCategory();
    const product = await createProduct(category.id, { salePrice: 250, mrp: 300, stock: 10 });

    await addToCart(token, product.id, 3);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: null });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(750);
    expect(res.body.data.paymentStatus).toBe('COD');

    const updated = await Product.findById(product.id);
    expect(updated!.stock).toBe(7);
  });

  it('rejects checkout when requested quantity exceeds stock', async () => {
    const user = await createUser();
    const token = authHeaderFor(user);
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 2 });

    // Bypass the cart's own stock check by adding a valid quantity, then
    // draining stock from under the cart before checkout to simulate a
    // race with another shopper.
    await addToCart(token, product.id, 2);
    await Product.findByIdAndUpdate(product.id, { stock: 0 });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: null });

    expect(res.status).toBe(400);
    const unchanged = await Product.findById(product.id);
    expect(unchanged!.stock).toBe(0);
  });

  it('applies a valid coupon and increments its usage count exactly once', async () => {
    const user = await createUser();
    const token = authHeaderFor(user);
    const category = await createCategory();
    const product = await createProduct(category.id, { salePrice: 1000, mrp: 1000, stock: 10 });
    const coupon = await createCoupon({ code: 'SAVE10', type: 'PERCENTAGE', value: 10, usageLimit: 5 });

    await addToCart(token, product.id, 1);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: coupon.code });

    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(100);

    const updatedCoupon = await Coupon.findById(coupon.id);
    expect(updatedCoupon!.usedCount).toBe(1);
  });

  it('rejects checkout once a coupon usage limit is reached', async () => {
    const user = await createUser();
    const token = authHeaderFor(user);
    const category = await createCategory();
    const product = await createProduct(category.id, { salePrice: 500, mrp: 500, stock: 10 });
    const coupon = await createCoupon({ code: 'ONEUSE', usageLimit: 1, usedCount: 1 });

    await addToCart(token, product.id, 1);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: coupon.code });

    expect(res.status).toBe(400);
  });

  it('does not allow a limited coupon to be used more times than its usage limit under concurrent checkouts', async () => {
    const category = await createCategory();
    const coupon = await createCoupon({ code: 'RACE10', usageLimit: 1 });

    const buyers = await Promise.all([createUser(), createUser()]);
    const products = await Promise.all(buyers.map(() => createProduct(category.id, { salePrice: 200, mrp: 200, stock: 10 })));

    await Promise.all(buyers.map((user, i) => addToCart(authHeaderFor(user), products[i].id, 1)));

    const results = await Promise.all(
      buyers.map((user, i) =>
        request(app)
          .post('/api/orders')
          .set('Authorization', authHeaderFor(user))
          .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: coupon.code })
      )
    );

    const successCount = results.filter((r) => r.status === 201).length;
    expect(successCount).toBe(1);

    const finalCoupon = await Coupon.findById(coupon.id);
    expect(finalCoupon!.usedCount).toBe(1);
  });

  it('does not decrement stock twice or leave partial state when order creation fails', async () => {
    const user = await createUser();
    const token = authHeaderFor(user);
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 3 });

    await addToCart(token, product.id, 1);
    await Product.findByIdAndUpdate(product.id, { stock: 0 });

    await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: null });

    const afterFailedCheckout = await Product.findById(product.id);
    expect(afterFailedCheckout!.stock).toBe(0);

    await Product.findByIdAndUpdate(product.id, { stock: 5 });
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', token)
      .send({ shippingAddress: address, paymentMethod: 'COD', couponCode: null });

    expect(res.status).toBe(201);
    const afterSuccess = await Product.findById(product.id);
    expect(afterSuccess!.stock).toBe(4);
  });
});
