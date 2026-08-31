import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import * as settingsRepository from '../repositories/settings.repository';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsRepository.getSettings();
  sendSuccess(res, settings, 'Settings retrieved successfully');
});
