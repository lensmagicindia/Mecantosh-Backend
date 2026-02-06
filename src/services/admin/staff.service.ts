import StaffConfig from '../../models/StaffConfig.model.js';
import Booking from '../../models/Booking.model.js';
import { IStaffConfigResponse, IStaffBooking, IDailyAvailability } from '../../interfaces/admin.interface.js';
import { IBooking } from '../../interfaces/booking.interface.js';
import { unavailabilityService } from './unavailability.service.js';

class AdminStaffService {
  /**
   * Get staff configuration (creates default if not exists)
   */
  async getStaffConfig(): Promise<IStaffConfigResponse> {
    let config = await StaffConfig.findOne();

    if (!config) {
      // Create default config
      config = await StaffConfig.create({
        totalStaff: 3,
        serviceDurationMinutes: 60,
        operatingStartTime: '08:00',
        operatingEndTime: '22:00',
      });
    }

    return this.formatConfigResponse(config);
  }

  /**
   * Update staff configuration
   */
  async updateStaffConfig(data: {
    totalStaff?: number;
    serviceDurationMinutes?: number;
    operatingStartTime?: string;
    operatingEndTime?: string;
    bookingWindowDays?: number;
  }): Promise<IStaffConfigResponse> {
    let config = await StaffConfig.findOne();

    if (!config) {
      config = new StaffConfig({
        totalStaff: data.totalStaff || 3,
        serviceDurationMinutes: data.serviceDurationMinutes || 60,
        operatingStartTime: data.operatingStartTime || '08:00',
        operatingEndTime: data.operatingEndTime || '22:00',
        bookingWindowDays: data.bookingWindowDays || 7,
      });
    } else {
      if (data.totalStaff !== undefined) config.totalStaff = data.totalStaff;
      if (data.serviceDurationMinutes !== undefined)
        config.serviceDurationMinutes = data.serviceDurationMinutes;
      if (data.operatingStartTime !== undefined) config.operatingStartTime = data.operatingStartTime;
      if (data.operatingEndTime !== undefined) config.operatingEndTime = data.operatingEndTime;
      if (data.bookingWindowDays !== undefined) config.bookingWindowDays = data.bookingWindowDays;
    }

    await config.save();

    return this.formatConfigResponse(config);
  }

  /**
   * Get daily availability for a specific date
   */
  async getDailyAvailability(date: string): Promise<IDailyAvailability> {
    const config = await this.getStaffConfig();
    const bookings = await this.getBookingsForDate(date);

    // Generate time slots based on operating hours
    const slots = this.generateTimeSlots(
      config.operatingStartTime,
      config.operatingEndTime,
      config.serviceDurationMinutes
    );

    // Get unavailability for the date
    const unavailabilities = await unavailabilityService.getByDate(date);

    // Helper to get unavailable count for a specific time
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

    // Calculate available staff for each slot
    const availableSlots = slots.map((time) => {
      const bookingsAtTime = bookings.filter((b) => {
        const bookingStart = new Date(b.startTime);
        const bookingEnd = new Date(b.endTime);
        const slotTime = this.parseTimeToDate(date, time);
        return slotTime >= bookingStart && slotTime < bookingEnd;
      });

      const unavailableCount = getUnavailableCount(time);
      const effectiveStaff = Math.max(0, config.totalStaff - unavailableCount);

      return {
        time,
        availableStaff: Math.max(0, effectiveStaff - bookingsAtTime.length),
      };
    });

    return {
      date,
      bookings,
      availableSlots,
    };
  }

  /**
   * Get bookings for a specific date
   */
  async getBookingsForDate(date: string): Promise<IStaffBooking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] },
    })
      .populate('user', 'name')
      .populate('vehicle', 'name')
      .populate('service', 'name durationMinutes')
      .sort({ scheduledTime: 1 });

    return bookings.map((booking, index) => this.formatStaffBooking(booking as unknown as IBooking, index + 1));
  }

  /**
   * Generate time slots for the day
   */
  private generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);

      currentMin += durationMinutes;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour += 1;
      }
    }

    return slots;
  }

  /**
   * Parse time string to Date object
   */
  private parseTimeToDate(date: string, time: string): Date {
    const [hour, minute] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hour, minute, 0, 0);
    return result;
  }

  /**
   * Format staff config for response
   */
  private formatConfigResponse(config: any): IStaffConfigResponse {
    return {
      totalStaff: config.totalStaff,
      serviceDurationMinutes: config.serviceDurationMinutes,
      operatingStartTime: config.operatingStartTime,
      operatingEndTime: config.operatingEndTime,
      bookingWindowDays: config.bookingWindowDays || 7,
    };
  }

  /**
   * Format booking for staff view
   */
  private formatStaffBooking(booking: any, staffAssigned: number): IStaffBooking {
    const scheduledDate = new Date(booking.scheduledDate);
    const [hour, minute] = booking.scheduledTime.split(':').map(Number);
    scheduledDate.setHours(hour, minute, 0, 0);

    const endTime = new Date(scheduledDate);
    const serviceDuration = booking.service?.durationMinutes || 60;
    endTime.setMinutes(endTime.getMinutes() + serviceDuration);

    return {
      id: booking._id.toString(),
      bookingId: booking._id.toString(),
      bookingNumber: booking.bookingNumber,
      customerName: booking.user?.name || 'Unknown',
      vehicleName: booking.vehicle?.name || 'Unknown',
      serviceName: booking.service?.name || 'Unknown',
      startTime: scheduledDate.toISOString(),
      endTime: endTime.toISOString(),
      staffAssigned,
    };
  }
}

export const adminStaffService = new AdminStaffService();
export default adminStaffService;
