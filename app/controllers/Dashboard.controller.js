const { prisma } = require('../database/Prisma.database');
const { formatResponse } = require('../helpers/App.helper');

class DashboardController {
  // Get Full Admin Dashboard Analytics Data
  static async getAnalytics(req, res, next) {
    try {
      // 1. Total Revenue calculation (Only PAID orders)
      const paidOrders = await prisma.order.findMany({
        where: { paymentStatus: 'PAID' }
      });
      const totalRevenue = paidOrders.reduce((sum, order) => sum + order.finalAmount, 0);

      // 2. Total Counts
      const totalOrders = await prisma.order.count();
      const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
      const totalProducts = await prisma.product.count();
      const lowStockProductsCount = await prisma.product.count({ where: { stock: { lte: 5 } } });

      // 3. Recent 5 Orders
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, email: true } } }
      });

      // 4. Top Selling Products
      const topProducts = await prisma.product.findMany({
        take: 5,
        orderBy: { orderItems: { _count: 'desc' } },
        include: { category: true }
      });

      return res.status(200).json(
        formatResponse(true, 'Admin Dashboard Analytics fetched successfully', {
          overview: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
            paidOrdersCount: paidOrders.length,
            totalUsers,
            totalProducts,
            lowStockProductsCount
          },
          recentOrders,
          topProducts
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
