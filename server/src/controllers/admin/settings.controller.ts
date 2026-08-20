import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { SiteSettings } from '../../models/SiteSettings';

export const updateAdminSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'default' },
    { $set: req.body },
    { upsert: true, new: true, runValidators: true }
  );
  sendSuccess(res, settings, 'Settings updated successfully');
});
