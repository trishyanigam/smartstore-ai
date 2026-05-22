import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Aggregate total revenue from paid orders
    const revenueAggregation = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue =
      revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    // 2. Low stock alert (stockCount < 10)
    const lowStockAlerts = await Product.find({ stockCount: { $lt: 10 } }).select(
      'name stockCount price'
    );

    // 3. Sales over time (group by month, e.g. for charts)
    const monthlySales = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
          },
          revenue: { $sum: '$totalPrice' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly sales for easier charting on frontend
    const formattedMonthlySales = monthlySales.map((item) => {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: item.revenue,
        orders: item.ordersCount,
      };
    });

    // 4. Product category breakdown for charts (Pie/Doughnut)
    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);

    const formattedCategoryBreakdown = categoryBreakdown.map((item) => ({
      category: item._id,
      count: item.count,
      averagePrice: Math.round(item.avgPrice * 100) / 100,
    }));

    res.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      lowStockAlerts,
      monthlySales: formattedMonthlySales,
      categoryBreakdown: formattedCategoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};
