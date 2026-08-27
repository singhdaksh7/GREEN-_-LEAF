import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';
import { Address } from '../models/Address';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: { name } },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 'Profile updated successfully');
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await Address.find({ user: req.user!.id }).sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, addresses, 'Addresses retrieved successfully');
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user!.id }, { isDefault: false });
  }
  const address = await Address.create({ ...req.body, user: req.user!.id });
  await User.findByIdAndUpdate(req.user!.id, { $addToSet: { addresses: address._id } });
  sendCreated(res, address, 'Address added successfully');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user!.id }, { isDefault: false });
  }
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!address) throw ApiError.notFound('Address not found');
  sendSuccess(res, address, 'Address updated successfully');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!address) throw ApiError.notFound('Address not found');
  await User.findByIdAndUpdate(req.user!.id, { $pull: { addresses: address._id } });
  sendSuccess(res, null, 'Address deleted successfully');
});
