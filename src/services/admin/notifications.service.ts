import AdminNotification from '../../models/AdminNotification.model.js';
import NotificationPreferences from '../../models/NotificationPreferences.model.js';
import {
  IAdminNotificationResponse,
  INotificationPreferencesResponse,
  AdminNotificationType,
} from '../../interfaces/admin.interface.js';

interface PaginatedNotifications {
  items: IAdminNotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AdminNotificationsService {
  /**
   * Get paginated notifications
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    type?: AdminNotificationType;
  }): Promise<PaginatedNotifications> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.type) {
      query.type = params.type;
    }

    const [notifications, total] = await Promise.all([
      AdminNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminNotification.countDocuments(query),
    ]);

    return {
      items: notifications.map(this.formatNotificationResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(limit: number = 5): Promise<IAdminNotificationResponse[]> {
    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications.map(this.formatNotificationResponse);
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    return AdminNotification.countDocuments({ isRead: false });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await AdminNotification.updateOne({ _id: id }, { isRead: true });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await AdminNotification.updateMany({ isRead: false }, { isRead: true });
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    type: AdminNotificationType;
    title: string;
    message: string;
    data?: {
      userId?: string;
      userName?: string;
      bookingId?: string;
      bookingNumber?: string;
      reason?: string;
      step?: string;
    };
  }): Promise<IAdminNotificationResponse> {
    const notification = await AdminNotification.create({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: false,
    });

    return this.formatNotificationResponse(notification);
  }

  /**
   * Get notification preferences for an admin
   */
  async getPreferences(adminId: string): Promise<INotificationPreferencesResponse> {
    let preferences = await NotificationPreferences.findOne({ adminId });

    if (!preferences) {
      // Create default preferences
      preferences = await NotificationPreferences.create({
        adminId,
        emailNewUser: true,
        emailNewBooking: true,
        emailBookingCancelled: true,
        inAppEnabled: true,
      });
    }

    return this.formatPreferencesResponse(preferences);
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    adminId: string,
    data: {
      emailNewUser?: boolean;
      emailNewBooking?: boolean;
      emailBookingCancelled?: boolean;
      inAppEnabled?: boolean;
    }
  ): Promise<INotificationPreferencesResponse> {
    let preferences = await NotificationPreferences.findOne({ adminId });

    if (!preferences) {
      preferences = new NotificationPreferences({
        adminId,
        emailNewUser: data.emailNewUser !== undefined ? data.emailNewUser : true,
        emailNewBooking: data.emailNewBooking !== undefined ? data.emailNewBooking : true,
        emailBookingCancelled: data.emailBookingCancelled !== undefined ? data.emailBookingCancelled : true,
        inAppEnabled: data.inAppEnabled !== undefined ? data.inAppEnabled : true,
      });
    } else {
      if (data.emailNewUser !== undefined) preferences.emailNewUser = data.emailNewUser;
      if (data.emailNewBooking !== undefined) preferences.emailNewBooking = data.emailNewBooking;
      if (data.emailBookingCancelled !== undefined)
        preferences.emailBookingCancelled = data.emailBookingCancelled;
      if (data.inAppEnabled !== undefined) preferences.inAppEnabled = data.inAppEnabled;
    }

    await preferences.save();

    return this.formatPreferencesResponse(preferences);
  }

  /**
   * Format notification for response
   */
  private formatNotificationResponse(notification: any): IAdminNotificationResponse {
    return {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  /**
   * Format preferences for response
   */
  private formatPreferencesResponse(preferences: any): INotificationPreferencesResponse {
    return {
      emailNewUser: preferences.emailNewUser,
      emailNewBooking: preferences.emailNewBooking,
      emailBookingCancelled: preferences.emailBookingCancelled,
      inAppEnabled: preferences.inAppEnabled,
    };
  }
}

export const adminNotificationsService = new AdminNotificationsService();
export default adminNotificationsService;
