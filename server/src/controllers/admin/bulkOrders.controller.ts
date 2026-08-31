import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import * as bulkOrderRepository from '../../repositories/bulkOrder.repository';

export const listAdminBulkOrders = asyncHandler(async (req: Request, res: Response) => {
  const inquiries = await bulkOrderRepository.listAdminInquiries(req.query.status as never);
  sendSuccess(res, inquiries, 'Bulk order enquiries retrieved successfully');
});

export const updateAdminBulkOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await bulkOrderRepository.updateAdminInquiryStatus(req.params.id, req.body.status);
  sendSuccess(res, inquiry, 'Enquiry status updated');
});
