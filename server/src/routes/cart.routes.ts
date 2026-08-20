import { Router } from 'express';
import * as cartController from '../controllers/cart.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { addCartItemSchema, updateCartItemSchema } from '../validators/cart.validators';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch('/items', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCartHandler);

export default router;
