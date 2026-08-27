import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  productSchema, categorySchema, couponSchema, blogPostSchema, settingsSchema,
  productUpdateSchema, categoryUpdateSchema, couponUpdateSchema, blogPostUpdateSchema,
} from '../validators/admin.validators';
import { updateOrderStatusSchema } from '../validators/order.validators';

import { getDashboardStats } from '../controllers/admin/dashboard.controller';
import * as adminProducts from '../controllers/admin/products.controller';
import * as adminCategories from '../controllers/admin/categories.controller';
import * as adminOrders from '../controllers/admin/orders.controller';
import * as adminCustomers from '../controllers/admin/customers.controller';
import * as adminCoupons from '../controllers/admin/coupons.controller';
import * as adminReviews from '../controllers/admin/reviews.controller';
import * as adminBulkOrders from '../controllers/admin/bulkOrders.controller';
import * as adminBlog from '../controllers/admin/blog.controller';
import * as adminSettings from '../controllers/admin/settings.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', getDashboardStats);

router.get('/products', adminProducts.listAdminProducts);
router.post('/products', validate(productSchema), adminProducts.createAdminProduct);
router.patch('/products/:id', validate(productUpdateSchema), adminProducts.updateAdminProduct);
router.delete('/products/:id', adminProducts.deleteAdminProduct);

router.get('/categories', adminCategories.listAdminCategories);
router.post('/categories', validate(categorySchema), adminCategories.createAdminCategory);
router.patch('/categories/:id', validate(categoryUpdateSchema), adminCategories.updateAdminCategory);
router.delete('/categories/:id', adminCategories.deleteAdminCategory);

router.get('/orders', adminOrders.listAdminOrders);
router.get('/orders/:id', adminOrders.getAdminOrder);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), adminOrders.updateAdminOrderStatus);

router.get('/customers', adminCustomers.listCustomers);
router.get('/customers/:id', adminCustomers.getCustomer);
router.patch('/customers/:id/active', adminCustomers.setCustomerActive);

router.get('/coupons', adminCoupons.listAdminCoupons);
router.post('/coupons', validate(couponSchema), adminCoupons.createAdminCoupon);
router.patch('/coupons/:id', validate(couponUpdateSchema), adminCoupons.updateAdminCoupon);
router.delete('/coupons/:id', adminCoupons.disableAdminCoupon);

router.get('/reviews', adminReviews.listAdminReviews);
router.patch('/reviews/:id/approval', adminReviews.setReviewApproval);

router.get('/bulk-orders', adminBulkOrders.listAdminBulkOrders);
router.patch('/bulk-orders/:id/status', adminBulkOrders.updateAdminBulkOrderStatus);

router.get('/blog', adminBlog.listAdminBlogPosts);
router.post('/blog', validate(blogPostSchema), adminBlog.createAdminBlogPost);
router.patch('/blog/:id', validate(blogPostUpdateSchema), adminBlog.updateAdminBlogPost);
router.delete('/blog/:id', adminBlog.deleteAdminBlogPost);

router.patch('/settings', validate(settingsSchema), adminSettings.updateAdminSettings);

export default router;
