import Booking from '../../models/Booking.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { adminNotificationsService } from './notifications.service.js';
import { notificationService } from '../notification.service.js';
import { smsService } from '../sms.service.js';
import { formatTimeSlot } from '../../utils/helpers.js';

interface BookingResponse {
  id: string;
  bookingNumber: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  };
  vehicle: {
    id: string;
    name: string;
    licensePlate: string;
    image?: string;
  };
  scheduledDate: string;
  scheduledTime: string;
  timeSlot: {
    start: string;
    end: string;
  };
  location: {
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedBookings {
  bookings: BookingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

class AdminBookingsService {
  /**
   * Get all bookings with filters
   */
  async getBookings(params: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    search?: string;
  }): Promise<PaginatedBookings> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    // Status filter
    if (params.status) {
      if (params.status === 'upcoming') {
        query.status = { $in: ['pending', 'confirmed'] };
        query.scheduledDate = { $gte: new Date() };
      } else {
        query.status = params.status;
      }
    }

    // Date filter
    if (params.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name phone countryCode')
        .populate('vehicle', 'name licensePlate image')
        .populate('service', 'name price durationMinutes')
        .sort({ scheduledDate: -1, scheduledTime: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    // Filter by search if provided
    let filteredBookings = bookings;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredBookings = bookings.filter((booking: any) => {
        return (
          booking.bookingNumber.toLowerCase().includes(searchLower) ||
          booking.user?.name?.toLowerCase().includes(searchLower) ||
          booking.user?.phone?.includes(searchLower) ||
          booking.vehicle?.name?.toLowerCase().includes(searchLower) ||
          booking.vehicle?.licensePlate?.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      bookings: filteredBookings.map(this.formatBookingResponse),
      pagination: {
        page,
        limit,
        total: params.search ? filteredBookings.length : total,
        pages: Math.ceil((params.search ? filteredBookings.length : total) / limit),
      },
    };
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<BookingResponse> {
    const booking = await Booking.findById(id)
      .populate('user', 'name phone countryCode')
      .populate('vehicle', 'name licensePlate image')
      .populate('service', 'name price durationMinutes');

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    return this.formatBookingResponse(booking);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    reason?: string
  ): Promise<BookingResponse> {
    const booking = await Booking.findById(id)
      .populate('user', 'name phone countryCode')
      .populate('vehicle', 'name licensePlate image')
      .populate('service', 'name price durationMinutes');

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    const oldStatus = booking.status;
    booking.status = status;

    if (status === 'cancelled') {
      booking.cancellationReason = reason || 'Cancelled by admin';
      booking.cancelledAt = new Date();

      // Create notification for cancelled booking
      await adminNotificationsService.createNotification({
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Booking #${booking.bookingNumber} has been cancelled`,
        data: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          reason: booking.cancellationReason,
        },
      });
    }

    if (status === 'completed') {
      booking.completedAt = new Date();

      // Create notification for completed booking
      await adminNotificationsService.createNotification({
        type: 'booking_completed',
        title: 'Booking Completed',
        message: `Booking #${booking.bookingNumber} has been completed`,
        data: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
        },
      });
    }

    if (status === 'confirmed' && oldStatus === 'pending') {
      // Send confirmation notification to customer
      this.sendBookingConfirmationToCustomer(booking).catch(() => {});
    }

    await booking.save();

    return this.formatBookingResponse(booking);
  }

  /**
   * Send booking confirmation to customer when admin confirms
   */
  private async sendBookingConfirmationToCustomer(booking: any): Promise<void> {
    try {
      const user = booking.user;
      const service = booking.service;

      if (!user || !service) return;

      const dateStr = booking.scheduledDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = formatTimeSlot(booking.scheduledTime);

      // Send SMS confirmation
      await smsService.sendBookingConfirmation(
        user.phone,
        user.countryCode || '+91',
        booking.bookingNumber,
        service.name,
        dateStr,
        timeStr
      );

      // Send push notification
      await notificationService.sendBookingConfirmation(
        user._id.toString(),
        booking.bookingNumber,
        service.name,
        dateStr,
        timeStr
      );
    } catch (error) {
      console.error('Failed to send booking confirmation to customer:', error);
    }
  }

  /**
   * Format booking for response
   */
  private formatBookingResponse(booking: any): BookingResponse {
    return {
      id: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      user: booking.user
        ? {
            id: booking.user._id.toString(),
            name: booking.user.name,
            phone: `${booking.user.countryCode || '+91'}${booking.user.phone}`,
          }
        : {
            id: '',
            name: 'Unknown',
            phone: '',
          },
      service: booking.service
        ? {
            id: booking.service._id.toString(),
            name: booking.service.name,
            price: booking.service.price,
            durationMinutes: booking.service.durationMinutes,
          }
        : {
            id: '',
            name: 'Unknown',
            price: 0,
            durationMinutes: 0,
          },
      vehicle: booking.vehicle
        ? {
            id: booking.vehicle._id.toString(),
            name: booking.vehicle.name,
            licensePlate: booking.vehicle.licensePlate,
            image: booking.vehicle.image,
          }
        : {
            id: '',
            name: 'Unknown',
            licensePlate: '',
          },
      scheduledDate: booking.scheduledDate.toISOString(),
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
      updatedAt: booking.updatedAt,
    };
  }
}

export const adminBookingsService = new AdminBookingsService();
export default adminBookingsService;
