import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { prisma } from '../../config/db';
import * as userRepository from '../../repositories/user.repository';

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const { users, total } = await userRepository.listCustomers({
    q: req.query.q ? String(req.query.q) : undefined,
    page,
    limit,
  });

  sendSuccess(res, { customers: users, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Customers retrieved successfully');
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await userRepository.findCustomerById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, orderBy: { createdAt: 'desc' } });
  sendSuccess(res, { customer, orders }, 'Customer retrieved successfully');
});

export const setCustomerActive = asyncHandler(async (req: Request, res: Response) => {
  const existing = await userRepository.findCustomerById(req.params.id);
  if (!existing) throw ApiError.notFound('Customer not found');
  const customer = await userRepository.setUserActive(req.params.id, Boolean(req.body.isActive));
  sendSuccess(res, customer, 'Customer status updated');
});
