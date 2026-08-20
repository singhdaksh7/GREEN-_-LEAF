import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createOrderSchema, trackOrderSchema } from '../validators/order.validators';

const router = Router();

router.post('/track', validate(trackOrderSchema), orderController.trackOrderPublic);
router.use(authenticate);
router.post('/', validate(createOrderSchema), orderController.placeOrder);
router.get('/', orderController.listMyOrders);
router.get('/:id', orderController.getMyOrder);

export default router;
