export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_IMAGES_PER_UPLOAD = 8;

export const PRODUCT_IMAGE_MAX_DIMENSION = 1600;
export const PRODUCT_IMAGE_THUMBNAIL_DIMENSION = 300;
export const PRODUCT_IMAGE_WEBP_QUALITY = 82;

/**
 * The upload controller always writes a thumbnail alongside the full image
 * under the same UUID (see uploads.controller.ts), but only the full
 * image's key is ever persisted on the product (IProductImage.key). This
 * derives the sibling thumbnail key from it so cleanup code can delete both
 * without needing a second field on every image.
 */
export function deriveThumbnailKey(key: string): string {
  return key.replace(/\.webp$/, '-thumb.webp');
}
