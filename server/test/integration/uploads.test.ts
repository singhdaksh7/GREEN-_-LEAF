import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createUser, authHeaderFor } from '../helpers/factories';

const app = createApp();

async function makeImageBuffer(format: 'jpeg' | 'png' | 'webp' = 'jpeg'): Promise<Buffer> {
  const image = sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 100, g: 180, b: 100 } } });
  if (format === 'jpeg') return image.jpeg().toBuffer();
  if (format === 'png') return image.png().toBuffer();
  return image.webp().toBuffer();
}

beforeAll(async () => {
  await setupTestDb();
}, 120000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await teardownTestDb();
  fs.rmSync(env.uploadDir, { recursive: true, force: true });
});

describe('POST /api/admin/uploads/images', () => {
  it('rejects an unauthenticated request', async () => {
    const buffer = await makeImageBuffer('jpeg');
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .attach('images', buffer, { filename: 'plant.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin customer', async () => {
    const customer = await createUser({ role: 'CUSTOMER' });
    const buffer = await makeImageBuffer('jpeg');
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(customer))
      .attach('images', buffer, { filename: 'plant.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });

  it.each(['jpeg', 'png', 'webp'] as const)('accepts a valid %s image and stores it under UPLOAD_DIR', async (format) => {
    const admin = await createUser({ role: 'ADMIN' });
    const buffer = await makeImageBuffer(format);
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(admin))
      .attach('images', buffer, { filename: `plant.${format}`, contentType: `image/${format}` });

    expect(res.status).toBe(201);
    expect(res.body.data.images).toHaveLength(1);
    const image = res.body.data.images[0];
    expect(image.url).toMatch(/^\/uploads\/products\/[a-f0-9-]+\.webp$/);
    expect(image.thumbnailUrl).toMatch(/^\/uploads\/products\/[a-f0-9-]+-thumb\.webp$/);
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);

    // Stored under a server-generated UUID name, not the client's filename,
    // and physically present under the configured upload directory.
    const key = image.url.replace('/uploads/', '');
    expect(fs.existsSync(path.join(env.uploadDir, key))).toBe(true);
  });

  it('rejects a file whose declared type does not match its actual bytes (spoofed image)', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const notAnImage = Buffer.from('#!/bin/sh\necho pwned\n');
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(admin))
      .attach('images', notAnImage, { filename: 'plant.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
  });

  it('rejects an unsupported mime type up front', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(admin))
      .attach('images', Buffer.from('<svg></svg>'), { filename: 'plant.svg', contentType: 'image/svg+xml' });

    expect(res.status).toBe(400);
  });

  it('rejects an oversized file', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const huge = Buffer.alloc(9 * 1024 * 1024, 1);
    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(admin))
      .attach('images', huge, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
  });

  it('rejects more than the allowed number of files in one request', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const buffer = await makeImageBuffer('jpeg');
    let req = request(app).post('/api/admin/uploads/images').set('Authorization', authHeaderFor(admin));
    for (let i = 0; i < 9; i += 1) {
      req = req.attach('images', buffer, { filename: `plant-${i}.jpg`, contentType: 'image/jpeg' });
    }
    const res = await req;
    expect(res.status).toBe(400);
  });

  it('cleans up any files already written in the batch when a later file fails', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const goodBuffer = await makeImageBuffer('jpeg');
    const badBuffer = Buffer.from('not an image');

    const beforeFiles = fs.existsSync(path.join(env.uploadDir, 'products'))
      ? fs.readdirSync(path.join(env.uploadDir, 'products'))
      : [];

    const res = await request(app)
      .post('/api/admin/uploads/images')
      .set('Authorization', authHeaderFor(admin))
      .attach('images', goodBuffer, { filename: 'good.jpg', contentType: 'image/jpeg' })
      .attach('images', badBuffer, { filename: 'bad.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);

    const afterFiles = fs.existsSync(path.join(env.uploadDir, 'products'))
      ? fs.readdirSync(path.join(env.uploadDir, 'products'))
      : [];
    expect(afterFiles.length).toBe(beforeFiles.length);
  });
});
