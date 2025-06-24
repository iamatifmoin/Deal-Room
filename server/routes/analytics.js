import express from 'express';
import Deal from '../models/Deal.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get analytics data
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Basic stats
    const totalDeals = await Deal.countDocuments();
    const totalValue = await Deal.aggregate([
      { $group: { _id: null, total: { $sum: '$currentPrice' } } }
    ]);
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const documentsShared = await Document.countDocuments();

    // Deal status distribution
    const dealsByStatus = await Deal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const statusColors = {
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      completed: '#10B981',
      cancelled: '#EF4444'
    };

    const formattedDealsByStatus = dealsByStatus.map(item => ({
      name: item._id.replace('_', ' '),
      value: item.count,
      color: statusColors[item._id] || '#6B7280'
    }));

    // Monthly deal data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const dealsByMonth = await Deal.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          deals: { $sum: 1 },
          value: { $sum: '$currentPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedDealsByMonth = dealsByMonth.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      deals: item.deals,
      value: item.value
    }));

    // User activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userActivity = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Format user activity data
    const activityMap = {};
    userActivity.forEach(item => {
      const date = item._id.date;
      if (!activityMap[date]) {
        activityMap[date] = { date, buyers: 0, sellers: 0 };
      }
      activityMap[date][item._id.role + 's'] = item.count;
    });

    const formattedUserActivity = Object.values(activityMap);

    const analyticsData = {
      totalDeals,
      totalValue: totalValue[0]?.total || 0,
      activeUsers,
      documentsShared,
      dealsByStatus: formattedDealsByStatus,
      dealsByMonth: formattedDealsByMonth,
      userActivity: formattedUserActivity
    };

    res.json({
      success: true,
      data: analyticsData,
      message: 'Analytics data retrieved successfully'
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve analytics data' });
  }
});

// Get user-specific analytics
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // User's deals
    const userDeals = await Deal.find({
      $or: [{ buyer: userId }, { seller: userId }]
    });

    const totalDeals = userDeals.length;
    const totalValue = userDeals.reduce((sum, deal) => sum + deal.currentPrice, 0);
    const completedDeals = userDeals.filter(deal => deal.status === 'completed').length;
    const successRate = totalDeals > 0 ? (completedDeals / totalDeals) * 100 : 0;

    // Messages sent
    const messagesSent = await Message.countDocuments({ sender: userId });

    // Documents uploaded
    const documentsUploaded = await Document.countDocuments({ uploadedBy: userId });

    const userAnalytics = {
      totalDeals,
      totalValue,
      completedDeals,
      successRate: Math.round(successRate),
      messagesSent,
      documentsUploaded
    };

    res.json({
      success: true,
      data: userAnalytics,
      message: 'User analytics retrieved successfully'
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve user analytics' });
  }
});

export default router;