import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review.validators';

const router = Router();

router.get('/', reviewController.listReviews);
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReviewHandler);

export default router;
