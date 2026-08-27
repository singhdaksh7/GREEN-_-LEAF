import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { Order } from '../../models/Order';
import * as orderService from '../../services/order.service';

export const listAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, { orders, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Orders retrieved successfully');
});

export const getAdminOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order, 'Order retrieved successfully');
});

export const updateAdminOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status, note);
  sendSuccess(res, order, 'Order status updated successfully');
});
