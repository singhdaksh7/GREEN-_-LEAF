import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import * as settingsRepository from '../../repositories/settings.repository';

export const updateAdminSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsRepository.updateSettings(req.body);
  sendSuccess(res, settings, 'Settings updated successfully');
});
