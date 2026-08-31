import { env } from '../config/env';
import { StorageProvider } from './StorageProvider';
import { LocalFileStorageProvider } from './LocalFileStorageProvider';

export type { StorageProvider, UploadOptions } from './StorageProvider';
export { LocalFileStorageProvider } from './LocalFileStorageProvider';

function createStorageProvider(): StorageProvider {
  // Only 'local' is implemented today (Hostinger/any normal Linux host with a
  // persistent disk). The factory shape is what makes it possible to add
  // 's3' / 'r2' / 'spaces' later without changing any caller.
  switch (env.storageProvider) {
    case 'local':
    default:
      return new LocalFileStorageProvider();
  }
}

export const storageProvider: StorageProvider = createStorageProvider();
