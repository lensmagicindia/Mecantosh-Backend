import Booking from '../../models/Booking.model.js';
import User from '../../models/User.model.js';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  completedToday: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  newUsersToday: number;
  newUsersWeek: number;
}

interface BookingChartData {
  date: string;
  bookings: number;
  completed: number;
  cancelled: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
}

interface UserChartData {
  date: string;
  users: number;
}

interface RecentActivity {
  id: string;
  type: 'new_user' | 'new_booking' | 'booking_completed' | 'booking_cancelled';
  message: string;
  timestamp: string;
  data?: {
    userId?: string;
    userName?: string;
    bookingId?: string;
  };
}

class AdminStatsService {
  /**
   * Get dashboard stats
   */
  async getStats(): Promise<DashboardStats> {
    const now = new Date();

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of this week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      completedToday,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      newUsersToday,
      newUsersWeek,
    ] = await Promise.all([
      // Total users
      User.countDocuments({ isActive: true }),

      // Total bookings
      Booking.countDocuments(),

      // Today's bookings
      Booking.countDocuments({
        scheduledDate: { $gte: startOfToday },
      }),

      // Pending bookings
      Booking.countDocuments({ status: 'pending' }),

      // Completed today
      Booking.countDocuments({
        status: 'completed',
        completedAt: { $gte: startOfToday },
      }),

      // Today's revenue
      this.calculateRevenue(startOfToday),

      // Week's revenue
      this.calculateRevenue(startOfWeek),

      // Month's revenue
      this.calculateRevenue(startOfMonth),

      // New users today
      User.countDocuments({
        createdAt: { $gte: startOfToday },
      }),

      // New users this week
      User.countDocuments({
        createdAt: { $gte: startOfWeek },
      }),
    ]);

    return {
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      completedToday,
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
      },
      newUsersToday,
      newUsersWeek,
    };
  }

  /**
   * Calculate revenue from completed bookings
   */
  private async calculateRevenue(sinceDate: Date): Promise<number> {
    const result = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Get bookings chart data
   */
  async getBookingsChart(period: 'week' | 'month' | 'year'): Promise<BookingChartData[]> {
    const { startDate, dateFormat, groupBy } = this.getPeriodConfig(period);

    const bookingsData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' },
          },
          bookings: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing dates
    return this.fillMissingDates(bookingsData, startDate, period, (item) => ({
      date: item._id,
      bookings: item.bookings,
      completed: item.completed,
      cancelled: item.cancelled,
    }), {
      bookings: 0,
      completed: 0,
      cancelled: 0,
    });
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChart(period: 'week' | 'month' | 'year'): Promise<RevenueChartData[]> {
    const { startDate, dateFormat } = this.getPeriodConfig(period);

    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$completedAt' },
          },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return this.fillMissingDates(revenueData, startDate, period, (item) => ({
      date: item._id,
      revenue: item.revenue,
    }), {
      revenue: 0,
    });
  }

  /**
   * Get users chart data
   */
  async getUsersChart(period: 'week' | 'month' | 'year'): Promise<UserChartData[]> {
    const { startDate, dateFormat } = this.getPeriodConfig(period);

    const usersData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' },
          },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return this.fillMissingDates(usersData, startDate, period, (item) => ({
      date: item._id,
      users: item.users,
    }), {
      users: 0,
    });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    for (const booking of recentBookings) {
      const user = booking.user as any;
      const userName = user?.name || 'Unknown';

      if (booking.status === 'completed') {
        activities.push({
          id: `booking_completed_${booking._id}`,
          type: 'booking_completed',
          message: `Booking #${booking.bookingNumber} completed for ${userName}`,
          timestamp: (booking.completedAt || booking.updatedAt).toISOString(),
          data: {
            bookingId: booking._id.toString(),
            userName,
          },
        });
      } else if (booking.status === 'cancelled') {
        activities.push({
          id: `booking_cancelled_${booking._id}`,
          type: 'booking_cancelled',
          message: `Booking #${booking.bookingNumber} cancelled by ${userName}`,
          timestamp: (booking.cancelledAt || booking.updatedAt).toISOString(),
          data: {
            bookingId: booking._id.toString(),
            userName,
          },
        });
      } else {
        activities.push({
          id: `new_booking_${booking._id}`,
          type: 'new_booking',
          message: `New booking #${booking.bookingNumber} from ${userName}`,
          timestamp: booking.createdAt.toISOString(),
          data: {
            bookingId: booking._id.toString(),
            userName,
          },
        });
      }
    }

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    for (const user of recentUsers) {
      activities.push({
        id: `new_user_${user._id}`,
        type: 'new_user',
        message: `New user registered: ${user.name}`,
        timestamp: user.createdAt.toISOString(),
        data: {
          userId: user._id.toString(),
          userName: user.name,
        },
      });
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get period configuration for date grouping
   */
  private getPeriodConfig(period: 'week' | 'month' | 'year'): {
    startDate: Date;
    dateFormat: string;
    groupBy: string;
  } {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let groupBy: string;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = '%Y-%m-%d';
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        dateFormat = '%Y-%m-%d';
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        dateFormat = '%Y-%m';
        groupBy = 'month';
        break;
    }

    startDate.setHours(0, 0, 0, 0);

    return { startDate, dateFormat, groupBy };
  }

  /**
   * Fill missing dates in chart data
   */
  private fillMissingDates<T, R>(
    data: T[],
    startDate: Date,
    period: 'week' | 'month' | 'year',
    transform: (item: T) => R & { date: string },
    defaultValues: Omit<R, 'date'>
  ): (R & { date: string })[] {
    const dataMap = new Map<string, R & { date: string }>();

    for (const item of data) {
      const transformed = transform(item);
      dataMap.set(transformed.date, transformed);
    }

    const result: (R & { date: string })[] = [];
    const current = new Date(startDate);
    const now = new Date();

    while (current <= now) {
      let dateStr: string;

      if (period === 'year') {
        dateStr = current.toISOString().slice(0, 7); // YYYY-MM
        current.setMonth(current.getMonth() + 1);
      } else {
        dateStr = current.toISOString().slice(0, 10); // YYYY-MM-DD
        current.setDate(current.getDate() + 1);
      }

      if (dataMap.has(dateStr)) {
        result.push(dataMap.get(dateStr)!);
      } else {
        result.push({
          date: dateStr,
          ...defaultValues,
        } as R & { date: string });
      }
    }

    return result;
  }
}

export const adminStatsService = new AdminStatsService();
export default adminStatsService;
