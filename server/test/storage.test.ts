import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, it, expect } from 'vitest';
import { LocalFileStorageProvider } from '../src/storage/LocalFileStorageProvider';

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'greenkart-storage-test-'));

afterAll(() => {
  fs.rmSync(testRoot, { recursive: true, force: true });
});

describe('LocalFileStorageProvider', () => {
  it('writes a file under the configured root and exposes it via a relative public URL', async () => {
    const provider = new LocalFileStorageProvider(testRoot);
    await provider.upload(Buffer.from('hello'), { key: 'products/abc.webp', contentType: 'image/webp' });

    expect(fs.readFileSync(path.join(testRoot, 'products', 'abc.webp'), 'utf8')).toBe('hello');
    expect(provider.getPublicUrl('products/abc.webp')).toBe('/uploads/products/abc.webp');
  });

  it('deletes a stored file, and is a no-op deleting one that does not exist', async () => {
    const provider = new LocalFileStorageProvider(testRoot);
    await provider.upload(Buffer.from('x'), { key: 'products/to-delete.webp', contentType: 'image/webp' });
    await provider.delete('products/to-delete.webp');
    expect(fs.existsSync(path.join(testRoot, 'products', 'to-delete.webp'))).toBe(false);

    await expect(provider.delete('products/never-existed.webp')).resolves.toBeUndefined();
  });

  it('refuses to read/write/delete a key that resolves outside the upload root', async () => {
    const provider = new LocalFileStorageProvider(testRoot);
    await expect(
      provider.upload(Buffer.from('escape'), { key: '../../etc/passwd', contentType: 'text/plain' })
    ).rejects.toThrow(/outside upload root/);
    await expect(provider.delete('../../etc/passwd')).rejects.toThrow(/outside upload root/);
  });
});
