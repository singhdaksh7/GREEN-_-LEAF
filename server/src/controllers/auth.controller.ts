import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import {
  registerUser,
  loginUser,
  issueTokens,
  rotateRefreshToken,
  invalidateRefreshTokens,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function serializeUser(user: IUser) {
  return {
    id: user._id?.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  const { accessToken, refreshToken } = issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  sendCreated(res, { user: serializeUser(user), accessToken }, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await loginUser(email, password);
  const { accessToken, refreshToken } = issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { user: serializeUser(user), accessToken }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const { accessToken, refreshToken } = await rotateRefreshToken(token);
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, { accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await invalidateRefreshTokens(req.user.id);
  }
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  sendSuccess(res, null, 'Logged out successfully');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, serializeUser(user), 'Current user fetched');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await requestPasswordReset(req.body.email);
  sendSuccess(res, null, 'If an account exists for this email, a reset link has been sent.');
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await resetPassword(token, password);
  sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await changePassword(req.user!.id, currentPassword, newPassword);
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  sendSuccess(res, null, 'Password updated. Please log in again.');
});
