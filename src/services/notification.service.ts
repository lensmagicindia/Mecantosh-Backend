import DeviceToken from '../models/DeviceToken.model.js';
import { getMessaging } from '../config/firebase.js';
import logger from '../utils/logger.js';

type Platform = 'ios' | 'android' | 'web';

class NotificationService {
  /**
   * Register device for push notifications
   */
  async registerDevice(
    userId: string,
    fcmToken: string,
    platform: Platform
  ): Promise<void> {
    // Upsert device token
    await DeviceToken.findOneAndUpdate(
      { user: userId, fcmToken },
      {
        user: userId,
        fcmToken,
        platform,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Unregister device
   */
  async unregisterDevice(userId: string, fcmToken: string): Promise<void> {
    await DeviceToken.deleteOne({ user: userId, fcmToken });
  }

  /**
   * Send push notification to user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    const messaging = getMessaging();
    if (!messaging) {
      logger.info(`[PUSH - No Firebase] To: ${userId} | Title: ${title} | Body: ${body}`);
      return;
    }

    // Get user's active device tokens
    const deviceTokens = await DeviceToken.find({ user: userId, isActive: true });

    if (deviceTokens.length === 0) {
      logger.debug(`No device tokens found for user ${userId}`);
      return;
    }

    const tokens = deviceTokens.map((dt) => dt.fcmToken);

    try {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'mecantosh_default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.debug(`Failed to send to token: ${resp.error?.message}`);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await DeviceToken.updateMany(
            { fcmToken: { $in: failedTokens } },
            { isActive: false }
          );
        }
      }

      logger.info(`Push sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failed`);
    } catch (error: any) {
      logger.error('Failed to send push notification:', error.message);
    }
  }

  /**
   * Send booking received notification (pending confirmation)
   */
  async sendBookingReceived(
    userId: string,
    bookingNumber: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'Booking Received!',
      `Your ${serviceName} for ${date} at ${time} is pending confirmation. We'll notify you once confirmed! Booking #${bookingNumber}`,
      {
        type: 'booking_received',
        bookingNumber,
      }
    );
  }

  /**
   * Send booking confirmation notification (after admin confirms)
   */
  async sendBookingConfirmation(
    userId: string,
    bookingNumber: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'Booking Confirmed!',
      `Your ${serviceName} is scheduled for ${date} at ${time}. Booking #${bookingNumber}`,
      {
        type: 'booking_confirmation',
        bookingNumber,
      }
    );
  }

  /**
   * Send booking status update notification
   */
  async sendStatusUpdate(
    userId: string,
    bookingNumber: string,
    status: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      in_progress: 'Your car wash has started!',
      completed: 'Your car wash is complete!',
      cancelled: 'Your booking has been cancelled.',
    };

    const message = statusMessages[status] || `Booking status updated to ${status}`;

    await this.sendToUser(userId, 'Booking Update', `${message} Booking #${bookingNumber}`, {
      type: 'booking_status',
      bookingNumber,
      status,
    });
  }

  /**
   * Send technician arrival notification
   */
  async sendTechnicianArrival(userId: string, bookingNumber: string): Promise<void> {
    await this.sendToUser(
      userId,
      'Technician Arriving',
      `Your technician is on the way! Booking #${bookingNumber}`,
      {
        type: 'technician_arrival',
        bookingNumber,
      }
    );
  }
}

export const notificationService = new NotificationService();
export default notificationService;
