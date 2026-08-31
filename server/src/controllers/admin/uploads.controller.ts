import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { storageProvider } from '../../storage';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  PRODUCT_IMAGE_MAX_DIMENSION,
  PRODUCT_IMAGE_THUMBNAIL_DIMENSION,
  PRODUCT_IMAGE_WEBP_QUALITY,
} from '../../config/upload';

interface UploadedImageResult {
  key: string;
  url: string;
  thumbnailKey: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw ApiError.badRequest('No image files were provided.');
  }

  const uploadedKeys: string[] = [];

  try {
    const images: UploadedImageResult[] = [];

    for (const file of files) {
      // Never trust the client-declared mimetype alone — sniff the actual
      // file bytes so a renamed executable/script can't slip through even
      // if it spoofs a Content-Type of image/jpeg.
      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !ALLOWED_IMAGE_MIME_TYPES.includes(detected.mime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
        throw ApiError.badRequest(
          `"${file.originalname}" is not a valid JPEG, PNG, or WebP image.`
        );
      }

      const id = randomUUID();
      const key = `products/${id}.webp`;
      const thumbnailKey = `products/${id}-thumb.webp`;

      const pipeline = sharp(file.buffer).rotate();
      const fullBuffer = await pipeline
        .clone()
        .resize(PRODUCT_IMAGE_MAX_DIMENSION, PRODUCT_IMAGE_MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: PRODUCT_IMAGE_WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });

      const thumbnailBuffer = await pipeline
        .clone()
        .resize(PRODUCT_IMAGE_THUMBNAIL_DIMENSION, PRODUCT_IMAGE_THUMBNAIL_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: PRODUCT_IMAGE_WEBP_QUALITY })
        .toBuffer();

      await storageProvider.upload(fullBuffer.data, { key, contentType: 'image/webp' });
      uploadedKeys.push(key);
      await storageProvider.upload(thumbnailBuffer, { key: thumbnailKey, contentType: 'image/webp' });
      uploadedKeys.push(thumbnailKey);

      images.push({
        key,
        url: storageProvider.getPublicUrl(key),
        thumbnailKey,
        thumbnailUrl: storageProvider.getPublicUrl(thumbnailKey),
        width: fullBuffer.info.width,
        height: fullBuffer.info.height,
      });
    }

    sendSuccess(res, { images }, 'Images uploaded successfully', 201);
  } catch (error) {
    // Clean up anything already written to storage in this same request
    // before surfacing the failure — an admin never ends up with orphaned
    // files just because a later file in the same batch failed validation.
    await Promise.all(
      uploadedKeys.map((key) =>
        storageProvider.delete(key).catch((cleanupError) => {
          console.warn(`[uploads] Failed to clean up orphaned upload "${key}":`, cleanupError);
        })
      )
    );
    throw error;
  }
});
