import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get comprehensive sales analytics report
// @route   GET /api/analytics/sales
// @access  Private/Admin
export const getSalesAnalytics = async (req, res, next) => {
  try {
    // 1. Total Revenue aggregation pipeline (KPIs)
    const totalRevenuePipeline = [
      { $match: { isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' },
        },
      },
    ];
    
    const totalRevenueResult = await Order.aggregate(totalRevenuePipeline);
    const revenueKpis = totalRevenueResult.length > 0
      ? {
          totalRevenue: Math.round(totalRevenueResult[0].totalRevenue * 100) / 100,
          totalOrders: totalRevenueResult[0].totalOrders,
          averageOrderValue: Math.round(totalRevenueResult[0].averageOrderValue * 100) / 100,
        }
      : {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        };

    // 2. Monthly Revenue aggregation pipeline
    const monthlyRevenuePipeline = [
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
    ];
    
    const monthlySalesResult = await Order.aggregate(monthlyRevenuePipeline);
    const formattedMonthlyRevenue = monthlySalesResult.map((item) => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: Math.round(item.revenue * 100) / 100,
        orders: item.ordersCount,
      };
    });

    // 3. Top Selling Products aggregation pipeline (Lookup-based join)
    const topSellingProductsPipeline = [
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalQtySold: { $sum: '$orderItems.qty' },
          totalRevenueGenerated: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: { $ifNull: ['$productDetails.title', '$productDetails.name', 'Unknown Product'] },
          category: { $ifNull: ['$productDetails.category', 'General'] },
          price: { $ifNull: ['$productDetails.price', 0] },
          totalQtySold: 1,
          totalRevenueGenerated: { $round: ['$totalRevenueGenerated', 2] },
        },
      },
      { $sort: { totalQtySold: -1 } },
      { $limit: 5 },
    ];
    
    const topSellingProducts = await Order.aggregate(topSellingProductsPipeline);

    // 4. Sales Summary: Category revenue/quantity breakdown
    const salesByCategoryPipeline = [
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$productDetails.category', 'General'] },
          totalRevenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
          totalUnitsSold: { $sum: '$orderItems.qty' },
        },
      },
      {
        $project: {
          category: '$_id',
          _id: 0,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalUnitsSold: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];
    
    const salesByCategory = await Order.aggregate(salesByCategoryPipeline);

    // Order status count & value distribution
    const orderStatusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
        },
      },
      {
        $project: {
          status: '$_id',
          _id: 0,
          count: 1,
          totalValue: { $round: ['$totalValue', 2] },
        },
      },
      { $sort: { count: -1 } },
    ];
    
    const orderStatusDistribution = await Order.aggregate(orderStatusPipeline);

    // Aggregate total count of items/units sold across all paid transactions
    const itemsSoldPipeline = [
      { $match: { isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: null,
          totalItemsSold: { $sum: '$orderItems.qty' },
        },
      },
    ];
    
    const itemsSoldResult = await Order.aggregate(itemsSoldPipeline);
    const totalItemsSold = itemsSoldResult.length > 0 ? itemsSoldResult[0].totalItemsSold : 0;

    res.json({
      revenueKpis,
      totalItemsSold,
      monthlyRevenue: formattedMonthlyRevenue,
      topSellingProducts,
      salesByCategory,
      orderStatusDistribution,
    });
  } catch (error) {
    next(error);
  }
};
