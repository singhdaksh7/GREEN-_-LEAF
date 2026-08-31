import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as userRepository from '../repositories/user.repository';
import * as addressRepository from '../repositories/address.repository';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = await userRepository.updateUserName(req.user!.id, name);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 'Profile updated successfully');
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressRepository.listAddressesForUser(req.user!.id);
  sendSuccess(res, addresses, 'Addresses retrieved successfully');
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressRepository.createAddress(req.user!.id, req.body);
  sendCreated(res, address, 'Address added successfully');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressRepository.updateAddress(req.params.id, req.user!.id, req.body);
  if (!address) throw ApiError.notFound('Address not found');
  sendSuccess(res, address, 'Address updated successfully');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await addressRepository.deleteAddress(req.params.id, req.user!.id);
  if (!deleted) throw ApiError.notFound('Address not found');
  sendSuccess(res, null, 'Address deleted successfully');
});
