import { Router } from 'express';
import * as blogController from '../controllers/blog.controller';

const router = Router();

router.get('/', blogController.listBlogPosts);
router.get('/:slug', blogController.getBlogPost);

export default router;
