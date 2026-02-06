import Booking from '../models/Booking.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Service from '../models/Service.model.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';
import { slotService } from './slot.service.js';
import { notificationService } from './notification.service.js';
import { smsService } from './sms.service.js';
import { adminNotificationsService } from './admin/notifications.service.js';
import { formatTimeSlot } from '../utils/helpers.js';
import {
  IBooking,
  IBookingResponse,
  IBookingLocation,
  BookingStatus,
} from '../interfaces/booking.interface.js';

interface CreateBookingData {
  vehicleId: string;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  location: IBookingLocation;
  notes?: string;
}

interface GetBookingsOptions {
  status?: 'upcoming' | 'completed' | 'cancelled';
  page: number;
  limit: number;
}

class BookingService {
  /**
   * Create new booking
   */
  async createBooking(userId: string, data: CreateBookingData): Promise<IBookingResponse> {
    // Verify vehicle belongs to user
    const vehicle = await Vehicle.findOne({
      _id: data.vehicleId,
      user: userId,
      isActive: true,
    });
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Verify service exists
    const service = await Service.findOne({ _id: data.serviceId, isActive: true });
    if (!service) {
      throw ApiError.notFound('Service not found');
    }

    // Parse and validate date
    const scheduledDate = new Date(data.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) {
      throw ApiError.badRequest('Cannot book for past dates');
    }

    // Validate booking window (week limit)
    await slotService.validateBookingWindow(scheduledDate);

    // Check slot availability
    const isAvailable = await slotService.isSlotAvailable(scheduledDate, data.scheduledTime);
    if (!isAvailable) {
      throw ApiError.conflict('Selected time slot is no longer available');
    }

    // Calculate pricing
    const subtotal = service.price;
    const serviceFee = config.service?.fee ?? 0;
    const tax = subtotal * (config.service?.taxRate ?? 0);
    const total = subtotal + serviceFee + tax;

    // Calculate end time
    const endTime = slotService.getEndTime(data.scheduledTime, service.durationMinutes);

    // Create booking with pending status - requires admin confirmation
    const booking = await Booking.create({
      user: userId,
      vehicle: data.vehicleId,
      service: data.serviceId,
      scheduledDate,
      scheduledTime: data.scheduledTime,
      timeSlot: {
        start: data.scheduledTime,
        end: endTime,
      },
      location: data.location,
      status: 'pending',
      subtotal,
      serviceFee,
      tax,
      total,
      notes: data.notes,
    });

    // Populate for response
    await booking.populate(['vehicle', 'service']);

    // Send booking received notification (not confirmation - admin must confirm)
    this.sendBookingReceivedNotification(booking).catch(() => {});

    // Create admin notification for new booking (async, don't wait)
    this.createAdminBookingNotification(booking, service.name).catch(() => {});

    return this.formatBookingResponse(booking);
  }

  /**
   * Get user bookings with filters
   */
  async getUserBookings(
    userId: string,
    options: GetBookingsOptions
  ): Promise<{
    bookings: IBookingResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { status, page, limit } = options;

    // Build query
    const query: any = { user: userId };

    if (status) {
      if (status === 'upcoming') {
        query.status = { $in: ['pending', 'confirmed', 'in_progress'] };
      } else {
        query.status = status;
      }
    }

    // Get total count
    const total = await Booking.countDocuments(query);

    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate(['vehicle', 'service'])
      .sort({ scheduledDate: -1, scheduledTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      bookings: bookings.map(this.formatBookingResponse),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string, userId: string): Promise<IBookingResponse> {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate([
      'vehicle',
      'service',
    ]);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    return this.formatBookingResponse(booking);
  }

  /**
   * Update booking (reschedule)
   */
  async updateBooking(
    bookingId: string,
    userId: string,
    data: { scheduledDate?: string; scheduledTime?: string; notes?: string }
  ): Promise<IBookingResponse> {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate('service');

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    // Can only update pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw ApiError.badRequest('Cannot modify this booking');
    }

    // If rescheduling, check new slot
    if (data.scheduledDate || data.scheduledTime) {
      const newDate = data.scheduledDate
        ? new Date(data.scheduledDate)
        : booking.scheduledDate;
      const newTime = data.scheduledTime || booking.scheduledTime;

      newDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        throw ApiError.badRequest('Cannot reschedule to past date');
      }

      // Validate booking window (week limit)
      await slotService.validateBookingWindow(newDate);

      // Check availability (exclude current booking)
      const isAvailable = await slotService.isSlotAvailable(newDate, newTime);
      if (!isAvailable) {
        // Check if it's the same slot (allow keeping same slot)
        const isSameSlot =
          newDate.getTime() === booking.scheduledDate.getTime() &&
          newTime === booking.scheduledTime;
        if (!isSameSlot) {
          throw ApiError.conflict('Selected time slot is not available');
        }
      }

      booking.scheduledDate = newDate;
      booking.scheduledTime = newTime;

      // Update time slot
      const service = booking.service as any;
      const endTime = slotService.getEndTime(newTime, service.durationMinutes);
      booking.timeSlot = { start: newTime, end: endTime };
    }

    if (data.notes !== undefined) {
      booking.notes = data.notes;
    }

    await booking.save();
    await booking.populate(['vehicle', 'service']);

    return this.formatBookingResponse(booking);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<IBookingResponse> {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate([
      'vehicle',
      'service',
    ]);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw ApiError.badRequest('Cannot cancel this booking');
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();

    await booking.save();

    // Create admin notification for cancelled booking (async, don't wait)
    this.createAdminCancellationNotification(booking, reason).catch(() => {});

    return this.formatBookingResponse(booking);
  }

  /**
   * Create admin notification for cancelled booking
   */
  private async createAdminCancellationNotification(
    booking: IBooking,
    reason?: string
  ): Promise<void> {
    try {
      await adminNotificationsService.createNotification({
        type: 'booking_cancelled',
        title: 'Booking Cancelled by Customer',
        message: `Booking #${booking.bookingNumber} was cancelled by the customer`,
        data: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          reason: reason || 'No reason provided',
        },
      });
    } catch (error) {
      console.error('Failed to create admin cancellation notification:', error);
    }
  }

  /**
   * Create admin notification for new booking
   */
  private async createAdminBookingNotification(
    booking: IBooking,
    serviceName: string
  ): Promise<void> {
    try {
      const dateStr = booking.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = formatTimeSlot(booking.scheduledTime);

      await adminNotificationsService.createNotification({
        type: 'new_booking',
        title: 'New Booking Received',
        message: `New booking #${booking.bookingNumber} for ${serviceName} on ${dateStr} at ${timeStr}`,
        data: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
      });
    } catch (error) {
      console.error('Failed to create admin notification:', error);
    }
  }

  /**
   * Send booking received notification (pending confirmation)
   */
  private async sendBookingReceivedNotification(booking: IBooking): Promise<void> {
    try {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('user')
        .populate('service');

      if (!populatedBooking) return;

      const user = populatedBooking.user as any;
      const service = populatedBooking.service as any;

      // Guard against missing populated data
      if (!user || !service) return;

      const dateStr = booking.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = formatTimeSlot(booking.scheduledTime);

      // Send SMS - booking received, pending confirmation
      await smsService.sendBookingReceived(
        user.phone,
        user.countryCode,
        booking.bookingNumber,
        service.name,
        dateStr,
        timeStr
      );

      // Send push notification - booking received
      await notificationService.sendBookingReceived(
        user._id.toString(),
        booking.bookingNumber,
        service.name,
        dateStr,
        timeStr
      );
    } catch (error) {
      // Log but don't fail
      console.error('Failed to send booking received notification:', error);
    }
  }

  /**
   * Format booking for response
   */
  private formatBookingResponse(booking: IBooking): IBookingResponse {
    const vehicle = booking.vehicle as any;
    const service = booking.service as any;

    return {
      id: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      service: {
        id: service._id.toString(),
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      },
      vehicle: {
        id: vehicle._id.toString(),
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        image: vehicle.image,
      },
      scheduledDate: booking.scheduledDate.toISOString().split('T')[0],
      scheduledTime: booking.scheduledTime,
      timeSlot: booking.timeSlot,
      location: booking.location,
      status: booking.status,
      subtotal: booking.subtotal,
      serviceFee: booking.serviceFee,
      tax: booking.tax,
      total: booking.total,
      notes: booking.notes,
      cancellationReason: booking.cancellationReason,
      cancelledAt: booking.cancelledAt,
      completedAt: booking.completedAt,
      createdAt: booking.createdAt,
    };
  }
}

export const bookingService = new BookingService();
export default bookingService;
