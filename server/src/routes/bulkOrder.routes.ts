import { Router } from 'express';
import * as bulkOrderController from '../controllers/bulkOrder.controller';
import { validate } from '../middleware/validate';
import { createBulkOrderSchema } from '../validators/bulkOrder.validators';

const router = Router();

router.post('/', validate(createBulkOrderSchema), bulkOrderController.createBulkOrderInquiry);

export default router;
