import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import * as orderRepository from '../../repositories/order.repository';

export const listAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const { orders, total } = await orderRepository.listAdminOrders({
    status: req.query.status as never,
    paymentStatus: req.query.paymentStatus as never,
    page,
    limit,
  });

  sendSuccess(res, { orders, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Orders retrieved successfully');
});

export const getAdminOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderRepository.getAdminOrder(req.params.id);
  sendSuccess(res, order, 'Order retrieved successfully');
});

export const updateAdminOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const order = await orderRepository.updateOrderStatus(req.params.id, status, note);
  sendSuccess(res, order, 'Order status updated successfully');
});
