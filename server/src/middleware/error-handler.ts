import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  // Unexpected errors are always logged server-side (including in production)
  // so on-call/diagnostics have a trail, while the response sent to the
  // client never leaks stack traces, messages, or other internal detail.
  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl}`, err instanceof Error ? err.stack ?? err.message : err);

  res.status(500).json({
    success: false,
    message: env.isProd ? 'Internal server error' : message,
  });
}
