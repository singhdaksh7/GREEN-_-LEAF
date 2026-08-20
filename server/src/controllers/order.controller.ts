import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { Order } from '../models/Order';
import * as orderService from '../services/order.service';

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;
  const order = await orderService.createOrder(req.user!.id, shippingAddress, paymentMethod, couponCode ?? null);
  sendCreated(res, order, 'Order placed successfully');
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
  sendSuccess(res, orders, 'Orders retrieved successfully');
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) throw ApiError.notFound('Order not found');
  sendSuccess(res, order, 'Order retrieved successfully');
});

export const trackOrderPublic = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber, contact } = req.body;
  const order = await orderService.trackOrder(orderNumber, contact);
  sendSuccess(res, order, 'Order found');
});
