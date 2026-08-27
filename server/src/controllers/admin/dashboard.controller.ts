import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { User } from '../../models/User';
import { BulkOrderInquiry } from '../../models/BulkOrderInquiry';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [revenueAgg, orderCount, customerCount, productCount, lowStockProducts, pendingOrders, recentOrders, pendingInquiries] =
    await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'COD'] } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      Product.countDocuments(),
      Product.find({ stock: { $lte: 10 }, isActive: true }).select('name slug stock').limit(10),
      Order.countDocuments({ orderStatus: 'PENDING' }),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      BulkOrderInquiry.countDocuments({ status: 'NEW' }),
    ]);

  sendSuccess(res, {
    revenue: revenueAgg[0]?.total ?? 0,
    orderCount,
    customerCount,
    productCount,
    lowStockProducts,
    pendingOrders,
    recentOrders,
    pendingInquiries,
  }, 'Dashboard stats retrieved successfully');
});
