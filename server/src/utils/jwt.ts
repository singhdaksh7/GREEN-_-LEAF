import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AccessTokenPayload {
  sub: string;
  role: JwtRole;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpires as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
