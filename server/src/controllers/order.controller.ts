import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import * as orderRepository from '../repositories/order.repository';

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;
  const order = await orderRepository.createOrder(req.user!.id, shippingAddress, paymentMethod, couponCode ?? null);
  sendCreated(res, order, 'Order placed successfully');
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderRepository.listMyOrders(req.user!.id);
  sendSuccess(res, orders, 'Orders retrieved successfully');
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderRepository.getMyOrder(req.user!.id, req.params.id);
  sendSuccess(res, order, 'Order retrieved successfully');
});

export const trackOrderPublic = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber, contact } = req.body;
  const order = await orderRepository.trackOrder(orderNumber, contact);
  sendSuccess(res, order, 'Order found');
});
