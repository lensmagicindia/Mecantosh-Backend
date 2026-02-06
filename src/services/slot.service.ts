import Booking from '../models/Booking.model.js';
import Service from '../models/Service.model.js';
import StaffConfig from '../models/StaffConfig.model.js';
import { TIME_SLOTS, MAX_BOOKINGS_PER_SLOT } from '../utils/constants.js';
import { formatTimeSlot, calculateEndTime } from '../utils/helpers.js';
import { ISlotAvailability } from '../interfaces/booking.interface.js';
import { ApiError } from '../utils/ApiError.js';
import { unavailabilityService } from './admin/unavailability.service.js';

interface SlotGroup {
  label: string;
  slots: ISlotAvailability[];
}

class SlotService {
  /**
   * Get available slots for a specific date and service
   */
  async getAvailableSlots(
    date: string,
    serviceId: string
  ): Promise<{
    date: string;
    serviceDuration: number;
    bookingWindowDays: number;
    slots: {
      morning: ISlotAvailability[];
      afternoon: ISlotAvailability[];
      evening: ISlotAvailability[];
      night: ISlotAvailability[];
    };
  }> {
    // Verify service exists
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      throw ApiError.notFound('Service not found');
    }

    // Parse the date
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      throw ApiError.badRequest('Cannot book for past dates');
    }

    // Get staff configuration
    const staffConfig = await StaffConfig.findOne();
    const maxPerSlot = staffConfig?.totalStaff || MAX_BOOKINGS_PER_SLOT;
    const bookingWindowDays = staffConfig?.bookingWindowDays || 7;

    // Check booking window limit
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingWindowDays);
    if (bookingDate > maxDate) {
      throw ApiError.badRequest(`Bookings are limited to ${bookingWindowDays} days in advance`);
    }

    // Get all bookings for that date (excluding cancelled)
    const existingBookings = await Booking.find({
      scheduledDate: bookingDate,
      status: { $nin: ['cancelled'] },
    });

    // Count bookings per time slot
    const slotCounts: Record<string, number> = {};
    existingBookings.forEach((booking) => {
      const slot = booking.scheduledTime;
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    });

    // Get unavailability for the date
    const unavailabilities = await unavailabilityService.getByDate(date);

    // Calculate unavailable count for each slot
    const getUnavailableCount = (time: string): number => {
      let count = 0;
      for (const u of unavailabilities) {
        if (u.type === 'full_day') {
          count += u.unavailableCount;
        } else if (u.type === 'time_slot' && u.timeSlots?.includes(time)) {
          count += u.unavailableCount;
        }
      }
      return count;
    };

    // Build availability for each time period
    const buildSlots = (slots: readonly string[]): ISlotAvailability[] => {
      return slots.map((time) => {
        const bookedCount = slotCounts[time] || 0;
        const unavailableCount = getUnavailableCount(time);
        const effectiveStaff = Math.max(0, maxPerSlot - unavailableCount);
        const availableStaff = Math.max(0, effectiveStaff - bookedCount);
        const available = availableStaff > 0;

        // Check if slot is in the past for today
        let isPast = false;
        if (bookingDate.getTime() === today.getTime()) {
          const [hours, minutes] = time.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          isPast = slotTime < new Date();
        }

        return {
          time,
          display: formatTimeSlot(time),
          available: available && !isPast,
          staffCount: isPast ? 0 : availableStaff,
        };
      });
    };

    return {
      date,
      serviceDuration: service.durationMinutes,
      bookingWindowDays,
      slots: {
        morning: buildSlots(TIME_SLOTS.MORNING.slots),
        afternoon: buildSlots(TIME_SLOTS.AFTERNOON.slots),
        evening: buildSlots(TIME_SLOTS.EVENING.slots),
        night: buildSlots(TIME_SLOTS.NIGHT.slots),
      },
    };
  }

  /**
   * Check if a specific slot is available
   */
  async isSlotAvailable(date: Date, time: string): Promise<boolean> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const dateStr = dateOnly.toISOString().split('T')[0];

    // Get booked count
    const bookedCount = await Booking.countDocuments({
      scheduledDate: dateOnly,
      scheduledTime: time,
      status: { $nin: ['cancelled'] },
    });

    // Get staff count from StaffConfig
    const staffConfig = await StaffConfig.findOne();
    const maxPerSlot = staffConfig?.totalStaff || MAX_BOOKINGS_PER_SLOT;

    // Get unavailable count for this slot
    const unavailableCount = await unavailabilityService.getUnavailableCountForSlot(dateStr, time);

    // Calculate effective available staff
    const effectiveStaff = Math.max(0, maxPerSlot - unavailableCount);

    return bookedCount < effectiveStaff;
  }

  /**
   * Validate booking date is within allowed window
   */
  async validateBookingWindow(date: Date): Promise<void> {
    const staffConfig = await StaffConfig.findOne();
    const bookingWindowDays = staffConfig?.bookingWindowDays || 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingWindowDays);

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate > maxDate) {
      throw ApiError.badRequest(`Bookings are limited to ${bookingWindowDays} days in advance`);
    }
  }

  /**
   * Get booking window days from config
   */
  async getBookingWindowDays(): Promise<number> {
    const staffConfig = await StaffConfig.findOne();
    return staffConfig?.bookingWindowDays || 7;
  }

  /**
   * Get end time for a booking based on service duration
   */
  getEndTime(startTime: string, durationMinutes: number): string {
    return calculateEndTime(startTime, durationMinutes);
  }
}

export const slotService = new SlotService();
export default slotService;
