import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { BulkOrderInquiry } from '../../models/BulkOrderInquiry';

export const listAdminBulkOrders = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const inquiries = await BulkOrderInquiry.find(filter).sort({ createdAt: -1 });
  sendSuccess(res, inquiries, 'Bulk order enquiries retrieved successfully');
});

export const updateAdminBulkOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await BulkOrderInquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!inquiry) throw ApiError.notFound('Enquiry not found');
  sendSuccess(res, inquiry, 'Enquiry status updated');
});
