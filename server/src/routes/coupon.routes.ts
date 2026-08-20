import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/validate', authenticate, couponController.validateCoupon);

export default router;
