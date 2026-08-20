import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { SiteSettings } from '../models/SiteSettings';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { upsert: true, new: true }
  );
  sendSuccess(res, settings, 'Settings retrieved successfully');
});
