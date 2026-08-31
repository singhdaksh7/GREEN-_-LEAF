import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGES_PER_UPLOAD, MAX_IMAGE_FILE_SIZE_BYTES } from '../config/upload';

/**
 * Memory storage only — files never touch disk under their original name or
 * with client-controlled content. The upload controller re-encodes every
 * image (via sharp) and writes it under a server-generated UUID key, so
 * nothing here ever trusts the client's filename or declared mimetype alone.
 */
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE_BYTES,
    files: MAX_IMAGES_PER_UPLOAD,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      callback(new ApiError(400, `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`));
      return;
    }
    callback(null, true);
  },
}).array('images', MAX_IMAGES_PER_UPLOAD);

// Wraps multer so its errors (file too large, too many files, rejected
// mimetype) reach the app's shared error handler as a clean 400 instead of
// a raw multer/500 error.
export function uploadProductImagesMiddleware(req: Request, res: Response, next: NextFunction): void {
  multerUpload(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError) {
      const messages: Record<string, string> = {
        LIMIT_FILE_SIZE: `Each image must be under ${MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        LIMIT_FILE_COUNT: `You can upload at most ${MAX_IMAGES_PER_UPLOAD} images at a time.`,
        LIMIT_UNEXPECTED_FILE: `You can upload at most ${MAX_IMAGES_PER_UPLOAD} images at a time.`,
      };
      next(ApiError.badRequest(messages[err.code] ?? err.message));
      return;
    }
    next(err);
  });
}
