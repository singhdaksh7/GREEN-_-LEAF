import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { StorageProvider, UploadOptions } from './StorageProvider';

/**
 * Stores files on the local, persistent filesystem under `env.uploadDir`.
 * This is the target implementation for BigRock (or any normal Linux host
 * with a persistent disk) — no cloud credentials, no ephemeral-storage
 * assumptions. Keys are always server-generated (see uploads.controller.ts),
 * but resolvedPath() still guards against escaping the upload root as
 * defense in depth.
 */
export class LocalFileStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root: string = env.uploadDir) {
    this.root = root;
  }

  private resolvedPath(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Refusing to access storage key outside upload root: ${key}`);
    }
    return resolved;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<void> {
    const filePath = this.resolvedPath(options.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvedPath(key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  getPublicUrl(key: string): string {
    const base = env.uploadBaseUrl.replace(/\/+$/, '');
    const normalizedKey = key.replace(/^\/+/, '');
    return `${base}/${normalizedKey}`;
  }
}
