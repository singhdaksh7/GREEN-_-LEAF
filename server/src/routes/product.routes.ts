import { Router } from 'express';
import * as productController from '../controllers/product.controller';

const router = Router();

router.get('/', productController.getProducts);
router.get('/:slug', productController.getProduct);

export default router;
