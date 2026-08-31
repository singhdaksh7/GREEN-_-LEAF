export interface UploadOptions {
  key: string;
  contentType: string;
}

/**
 * Storage is abstracted behind this interface so the local-disk
 * implementation (Hostinger/any normal Linux host) can later be swapped for
 * S3/R2/Spaces without touching any caller (upload controller, product
 * controller, etc) — they only ever deal in opaque storage keys and public
 * URLs, never filesystem paths.
 */
export interface StorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
