import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createUser, authHeaderFor, createCategory, createProduct } from '../helpers/factories';
import { prisma } from '../../src/config/db';
import { storageProvider } from '../../src/storage';

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

    const persisted = await prisma.product.findUnique({ where: { id: product.id }, include: { tags: true, variants: true } });
    expect(persisted!.tags.map((t) => t.tag)).toEqual(['bestseller', 'indoor']);
    expect(persisted!.variants).toHaveLength(1);
  });
});

describe('draft vs published visibility', () => {
  it('does not expose a draft product on the public storefront, but publishing makes it visible', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const draft = await createProduct(category.id, { name: 'Draft Cactus', status: 'DRAFT' });

    const draftListRes = await request(app).get('/api/products');
    expect(draftListRes.body.data.products.map((p: { name: string }) => p.name)).not.toContain('Draft Cactus');

    const draftDetailRes = await request(app).get(`/api/products/${draft.slug}`);
    expect(draftDetailRes.status).toBe(404);

    const publishRes = await request(app)
      .patch(`/api/admin/products/${draft.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ status: 'PUBLISHED' });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('PUBLISHED');
    expect(publishRes.body.data.isActive).toBe(true);

    const publishedListRes = await request(app).get('/api/products');
    expect(publishedListRes.body.data.products.map((p: { name: string }) => p.name)).toContain('Draft Cactus');
  });

  it('archiving a product (DELETE) hides it from the storefront and syncs isActive', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const product = await createProduct(category.id, { status: 'PUBLISHED' });

    const res = await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ARCHIVED');
    expect(res.body.data.isActive).toBe(false);

    const listRes = await request(app).get('/api/products');
    expect(listRes.body.data.products.map((p: { _id: string }) => p._id)).not.toContain(product.id);
  });
});

describe('product image lifecycle', () => {
  it('lets an admin fetch a single product regardless of status', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const draft = await createProduct(category.id, { status: 'DRAFT' });

    const res = await request(app)
      .get(`/api/admin/products/${draft.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(draft.id);
  });

  it('deletes the underlying file for a removed image but keeps the ones still referenced', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const category = await createCategory();
    const product = await createProduct(category.id, {
      images: [
        { url: '/uploads/products/keep.webp', key: 'products/keep.webp', alt: '', isPrimary: true, sortOrder: 0 },
        { url: '/uploads/products/remove.webp', key: 'products/remove.webp', alt: '', isPrimary: false, sortOrder: 1 },
      ],
    });

    const deleteSpy = vi.spyOn(storageProvider, 'delete').mockResolvedValue(undefined);

    const res = await request(app)
      .patch(`/api/admin/products/${product.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({
        images: [
          { url: '/uploads/products/keep.webp', key: 'products/keep.webp', alt: '', isPrimary: true, sortOrder: 0 },
        ],
      });

    expect(res.status).toBe(200);
    expect(deleteSpy).toHaveBeenCalledWith('products/remove.webp');
    expect(deleteSpy).toHaveBeenCalledWith('products/remove-thumb.webp');
    expect(deleteSpy).not.toHaveBeenCalledWith('products/keep.webp');
    expect(deleteSpy).not.toHaveBeenCalledWith('products/keep-thumb.webp');

    deleteSpy.mockRestore();
  });
});
