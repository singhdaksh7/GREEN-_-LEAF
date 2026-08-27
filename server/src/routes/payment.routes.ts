import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from '../validators/payment.validators';

const router = Router();

router.get('/razorpay/config', paymentController.razorpayConfigHandler);
router.use(authenticate);
router.post('/razorpay/create-order', validate(createRazorpayOrderSchema), paymentController.createRazorpayOrderHandler);
router.post('/razorpay/verify', validate(verifyRazorpayPaymentSchema), paymentController.verifyRazorpayPaymentHandler);

export default router;
