import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as newsletterRepository from '../repositories/newsletter.repository';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body.email ?? '').toLowerCase().trim();
  if (!email || !email.includes('@')) throw ApiError.badRequest('A valid email is required');

  const subscriber = await newsletterRepository.subscribe(email);
  sendCreated(res, subscriber, 'Subscribed successfully');
});
