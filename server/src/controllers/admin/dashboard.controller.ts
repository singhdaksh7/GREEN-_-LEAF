import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { prisma } from '../../config/db';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [revenueAgg, orderCount, customerCount, productCount, lowStockProducts, pendingOrders, recentOrders, pendingInquiries] =
    await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: { in: ['PAID', 'COD'] } },
        _sum: { grandTotal: true },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.product.findMany({
        where: { stock: { lte: 10 }, status: 'PUBLISHED' },
        select: { name: true, slug: true, stock: true },
        take: 10,
      }),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.bulkOrderInquiry.count({ where: { status: 'NEW' } }),
    ]);

  sendSuccess(res, {
    revenue: revenueAgg._sum.grandTotal ?? 0,
    orderCount,
    customerCount,
    productCount,
    lowStockProducts,
    pendingOrders,
    recentOrders,
    pendingInquiries,
  }, 'Dashboard stats retrieved successfully');
});
