import { Router } from 'express';
import * as searchController from '../controllers/search.controller';

const router = Router();

router.get('/', searchController.search);
router.get('/suggest', searchController.suggest);

export default router;
