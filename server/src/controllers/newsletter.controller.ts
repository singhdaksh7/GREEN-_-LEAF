import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body.email ?? '').toLowerCase().trim();
  if (!email || !email.includes('@')) throw ApiError.badRequest('A valid email is required');

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return sendCreated(res, existing, 'Subscribed successfully');
  }

  const subscriber = await NewsletterSubscriber.create({ email });
  sendCreated(res, subscriber, 'Subscribed successfully');
});
