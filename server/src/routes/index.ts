import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import searchRoutes from './search.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import couponRoutes from './coupon.routes';
import orderRoutes from './order.routes';
import reviewRoutes from './review.routes';
import newsletterRoutes from './newsletter.routes';
import bulkOrderRoutes from './bulkOrder.routes';
import blogRoutes from './blog.routes';
import settingsRoutes from './settings.routes';
import deliveryRoutes from './delivery.routes';
import accountRoutes from './account.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/search', searchRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/bulk-orders', bulkOrderRoutes);
router.use('/blog', blogRoutes);
router.use('/settings', settingsRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/account', accountRoutes);
router.use('/admin', adminRoutes);

export default router;
