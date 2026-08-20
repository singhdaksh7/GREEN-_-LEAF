import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<IUser> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash,
    role: 'CUSTOMER',
  });

  return user;
}

export async function loginUser(email: string, password: string): Promise<IUser> {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
}

export function issueTokens(user: IUser) {
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

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  return issueTokens(user);
}

export async function invalidateRefreshTokens(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
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
  const user = await User.findOne({ email: email.toLowerCase() });
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

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.badRequest('This reset link is invalid or has expired');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.tokenVersion += 1;
  await user.save();
}
