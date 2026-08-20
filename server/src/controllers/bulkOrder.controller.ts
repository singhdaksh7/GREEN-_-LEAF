import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated } from '../utils/ApiResponse';
import { BulkOrderInquiry } from '../models/BulkOrderInquiry';

export const createBulkOrderInquiry = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await BulkOrderInquiry.create(req.body);
  sendCreated(res, inquiry, 'Your bulk order enquiry has been submitted. Our team will contact you shortly.');
});
