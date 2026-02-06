import User from '../../models/User.model.js';
import Vehicle from '../../models/Vehicle.model.js';
import Booking from '../../models/Booking.model.js';
import { ApiError } from '../../utils/ApiError.js';

interface AdminUserView {
  id: string;
  name: string;
  phone: string;
  countryCode: string;
  email?: string;
  isVerified: boolean;
  createdAt: Date;
  totalBookings: number;
  totalSpent: number;
  vehicleCount: number;
}

interface UserDetail extends AdminUserView {
  vehicles: {
    id: string;
    name: string;
    licensePlate: string;
    make: string;
    model: string;
  }[];
  recentBookings: {
    id: string;
    service: string;
    date: string;
    status: string;
  }[];
}

interface PaginatedUsers {
  items: AdminUserView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

class AdminUsersService {
  /**
   * Get all users with filters and pagination
   */
  async getUsers(params: UserFilters): Promise<PaginatedUsers> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Search filter (name, phone, email)
    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    // Verified filter
    if (params.isVerified !== undefined) {
      query.isPhoneVerified = params.isVerified;
    }

    // Date range filter
    if (params.dateFrom || params.dateTo) {
      query.createdAt = {};
      if (params.dateFrom) {
        query.createdAt.$gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        const endDate = new Date(params.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Sorting
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    // Get aggregated data for each user
    const userIds = users.map((u) => u._id);

    const [bookingStats, vehicleCounts] = await Promise.all([
      Booking.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            totalBookings: { $sum: 1 },
            totalSpent: { $sum: '$total' },
          },
        },
      ]),
      Vehicle.aggregate([
        { $match: { user: { $in: userIds }, isActive: true } },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Create lookup maps
    const bookingStatsMap = new Map(
      bookingStats.map((s) => [s._id.toString(), s])
    );
    const vehicleCountMap = new Map(
      vehicleCounts.map((v) => [v._id.toString(), v.count])
    );

    const items: AdminUserView[] = users.map((user) => {
      const userId = user._id.toString();
      const stats = bookingStatsMap.get(userId) || {
        totalBookings: 0,
        totalSpent: 0,
      };
      const vehicleCount = vehicleCountMap.get(userId) || 0;

      return {
        id: userId,
        name: user.name,
        phone: user.phone,
        countryCode: user.countryCode,
        email: user.email,
        isVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
        totalBookings: stats.totalBookings,
        totalSpent: stats.totalSpent,
        vehicleCount,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user by ID with vehicles and recent bookings
   */
  async getUserById(id: string): Promise<UserDetail> {
    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Get user's vehicles
    const vehicles = await Vehicle.find({ user: id, isActive: true })
      .select('name licensePlate make vehicleModel')
      .limit(10);

    // Get recent bookings
    const recentBookings = await Booking.find({ user: id })
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get aggregated stats
    const [bookingStats] = await Booking.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$user',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const stats = bookingStats || { totalBookings: 0, totalSpent: 0 };
    const vehicleCount = await Vehicle.countDocuments({ user: id, isActive: true });

    return {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      countryCode: user.countryCode,
      email: user.email,
      isVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      totalBookings: stats.totalBookings,
      totalSpent: stats.totalSpent,
      vehicleCount,
      vehicles: vehicles.map((v) => ({
        id: v._id.toString(),
        name: v.name,
        licensePlate: v.licensePlate,
        make: v.make || '',
        model: v.vehicleModel || '',
      })),
      recentBookings: recentBookings.map((b: any) => ({
        id: b._id.toString(),
        service: b.service?.name || 'Unknown Service',
        date: b.scheduledDate.toISOString(),
        status: b.status,
      })),
    };
  }

  /**
   * Export users to CSV
   */
  async exportUsers(format: 'csv' | 'excel' = 'csv'): Promise<string> {
    const users = await User.find().sort({ createdAt: -1 });

    // Get aggregated data for all users
    const userIds = users.map((u) => u._id);

    const [bookingStats, vehicleCounts] = await Promise.all([
      Booking.aggregate([
        { $match: { user: { $in: userIds } } },
        {
          $group: {
            _id: '$user',
            totalBookings: { $sum: 1 },
            totalSpent: { $sum: '$total' },
          },
        },
      ]),
      Vehicle.aggregate([
        { $match: { user: { $in: userIds }, isActive: true } },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const bookingStatsMap = new Map(
      bookingStats.map((s) => [s._id.toString(), s])
    );
    const vehicleCountMap = new Map(
      vehicleCounts.map((v) => [v._id.toString(), v.count])
    );

    // Build CSV
    const headers = [
      'ID',
      'Name',
      'Phone',
      'Country Code',
      'Email',
      'Verified',
      'Total Bookings',
      'Total Spent',
      'Vehicles',
      'Created At',
    ];

    const rows = users.map((user) => {
      const userId = user._id.toString();
      const stats = bookingStatsMap.get(userId) || {
        totalBookings: 0,
        totalSpent: 0,
      };
      const vehicleCount = vehicleCountMap.get(userId) || 0;

      return [
        userId,
        user.name,
        user.phone,
        user.countryCode,
        user.email || '',
        user.isPhoneVerified ? 'Yes' : 'No',
        stats.totalBookings.toString(),
        stats.totalSpent.toFixed(2),
        vehicleCount.toString(),
        user.createdAt.toISOString(),
      ];
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    return csv;
  }
}

export const adminUsersService = new AdminUsersService();
export default adminUsersService;
