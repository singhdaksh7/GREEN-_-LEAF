import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { checkPincodeServiceability } from '../services/delivery.service';

export const checkPincode = asyncHandler(async (req: Request, res: Response) => {
  const pincode = String(req.query.pincode ?? '');
  const result = await checkPincodeServiceability(pincode);
  sendSuccess(res, result, 'Pincode checked');
});
