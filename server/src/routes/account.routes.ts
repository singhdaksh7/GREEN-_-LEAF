import { Router } from 'express';
import * as accountController from '../controllers/account.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateProfileSchema, addressSchema } from '../validators/account.validators';

const router = Router();

router.use(authenticate);

router.patch('/profile', validate(updateProfileSchema), accountController.updateProfile);
router.get('/addresses', accountController.listAddresses);
router.post('/addresses', validate(addressSchema), accountController.createAddress);
router.patch('/addresses/:id', accountController.updateAddress);
router.delete('/addresses/:id', accountController.deleteAddress);

export default router;
