import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { buildSafeContainsRegex } from '../../utils/regex';

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter: Record<string, unknown> = { role: 'CUSTOMER' };
  if (req.query.q) {
    const regex = buildSafeContainsRegex(String(req.query.q));
    filter.$or = [
      { name: regex },
      { email: regex },
    ];
  }

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { customers, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }, 'Customers retrieved successfully');
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'CUSTOMER' });
  if (!customer) throw ApiError.notFound('Customer not found');
  const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
  sendSuccess(res, { customer, orders }, 'Customer retrieved successfully');
});

export const setCustomerActive = asyncHandler(async (req: Request, res: Response) => {
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'CUSTOMER' },
    { isActive: Boolean(req.body.isActive) },
    { new: true }
  );
  if (!customer) throw ApiError.notFound('Customer not found');
  sendSuccess(res, customer, 'Customer status updated');
});
