import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import * as userRepository from '../repositories/user.repository';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(input: RegisterInput): Promise<User> {
  const email = normalizeEmail(input.email);
  const existing = await userRepository.findUserByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return userRepository.createUser({
    name: input.name.trim(),
    email,
    passwordHash,
    role: 'CUSTOMER',
  });
}

export async function loginUser(email: string, password: string): Promise<User> {
  const user = await userRepository.findUserByEmail(normalizeEmail(email));
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
}

export function issueTokens(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(token: string) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await userRepository.findUserById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  return issueTokens(user);
}

export async function invalidateRefreshTokens(userId: string): Promise<void> {
  await userRepository.incrementTokenVersion(userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await userRepository.findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw ApiError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userRepository.updatePasswordAndBumpTokenVersion(userId, passwordHash);
}

interface ResetTokenPayload {
  sub: string;
  purpose: 'password-reset';
  tokenVersion: number;
}

/**
 * No email provider is wired up yet, so the reset link is logged to the
 * server console instead of being emailed. Swap this for a real email
 * service later without changing the request/response contract.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await userRepository.findUserByEmail(normalizeEmail(email));
  if (!user) return; // Do not reveal whether the account exists.

  const resetToken = jwt.sign(
    { sub: user.id, purpose: 'password-reset', tokenVersion: user.tokenVersion } satisfies ResetTokenPayload,
    env.jwtAccessSecret,
    { expiresIn: '30m' }
  );

  // eslint-disable-next-line no-console
  console.log(`[auth] Password reset link for ${user.email}: ${env.clientUrl}/reset-password?token=${resetToken}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  let payload: ResetTokenPayload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret) as ResetTokenPayload;
  } catch {
    throw ApiError.badRequest('This reset link is invalid or has expired');
  }

  if (payload.purpose !== 'password-reset') throw ApiError.badRequest('Invalid reset token');

  const user = await userRepository.findUserById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.badRequest('This reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userRepository.updatePasswordAndBumpTokenVersion(user.id, passwordHash);
}
