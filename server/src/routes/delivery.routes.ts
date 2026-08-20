import { Router } from 'express';
import * as deliveryController from '../controllers/delivery.controller';

const router = Router();

router.get('/check', deliveryController.checkPincode);

export default router;
