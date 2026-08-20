import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { JwtRole } from '../utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = req.cookies?.accessToken ?? bearerToken;

  if (!token) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = req.cookies?.accessToken ?? bearerToken;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function authorize(...roles: JwtRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    next();
  };
}
