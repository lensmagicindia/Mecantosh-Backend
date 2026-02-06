import StaffUnavailability, {
  IStaffUnavailability,
  IStaffUnavailabilityResponse,
  UnavailabilityType,
} from '../../models/StaffUnavailability.model.js';
import { ApiError } from '../../utils/ApiError.js';

interface CreateUnavailabilityData {
  date: string;
  type: UnavailabilityType;
  timeSlots?: string[];
  unavailableCount?: number;
  reason?: string;
}

interface UpdateUnavailabilityData {
  type?: UnavailabilityType;
  timeSlots?: string[];
  unavailableCount?: number;
  reason?: string;
}

class UnavailabilityService {
  /**
   * Create a new unavailability entry
   */
  async create(data: CreateUnavailabilityData): Promise<IStaffUnavailabilityResponse> {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Check for existing unavailability on the same date with same type/slots
    const existing = await StaffUnavailability.findOne({
      date,
      type: data.type,
      ...(data.type === 'time_slot' && data.timeSlots
        ? { timeSlots: { $in: data.timeSlots } }
        : {}),
    });

    if (existing && data.type === 'full_day') {
      throw ApiError.conflict('Full day unavailability already exists for this date');
    }

    const unavailability = await StaffUnavailability.create({
      date,
      type: data.type,
      timeSlots: data.type === 'time_slot' ? data.timeSlots : undefined,
      unavailableCount: data.unavailableCount || 1,
      reason: data.reason,
    });

    return this.formatResponse(unavailability);
  }

  /**
   * List unavailability entries with optional date range filter
   */
  async list(startDate?: string, endDate?: string): Promise<IStaffUnavailabilityResponse[]> {
    const query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const unavailabilities = await StaffUnavailability.find(query).sort({ date: 1 });
    return unavailabilities.map(this.formatResponse);
  }

  /**
   * Get all unavailability entries for a specific date
   */
  async getByDate(date: string): Promise<IStaffUnavailabilityResponse[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const unavailabilities = await StaffUnavailability.find({
      date: { $gte: targetDate, $lte: endOfDay },
    }).sort({ type: 1 });

    return unavailabilities.map(this.formatResponse);
  }

  /**
   * Get unavailability by ID
   */
  async getById(id: string): Promise<IStaffUnavailabilityResponse> {
    const unavailability = await StaffUnavailability.findById(id);
    if (!unavailability) {
      throw ApiError.notFound('Unavailability entry not found');
    }
    return this.formatResponse(unavailability);
  }

  /**
   * Update an unavailability entry
   */
  async update(id: string, data: UpdateUnavailabilityData): Promise<IStaffUnavailabilityResponse> {
    const unavailability = await StaffUnavailability.findById(id);
    if (!unavailability) {
      throw ApiError.notFound('Unavailability entry not found');
    }

    if (data.type !== undefined) unavailability.type = data.type;
    if (data.timeSlots !== undefined) unavailability.timeSlots = data.timeSlots;
    if (data.unavailableCount !== undefined) unavailability.unavailableCount = data.unavailableCount;
    if (data.reason !== undefined) unavailability.reason = data.reason;

    await unavailability.save();
    return this.formatResponse(unavailability);
  }

  /**
   * Delete an unavailability entry
   */
  async delete(id: string): Promise<void> {
    const unavailability = await StaffUnavailability.findById(id);
    if (!unavailability) {
      throw ApiError.notFound('Unavailability entry not found');
    }
    await unavailability.deleteOne();
  }

  /**
   * Get total unavailable staff count for a specific date and time slot
   */
  async getUnavailableCountForSlot(date: string, time: string): Promise<number> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const unavailabilities = await StaffUnavailability.find({
      date: { $gte: targetDate, $lte: endOfDay },
    });

    let totalUnavailable = 0;

    for (const u of unavailabilities) {
      if (u.type === 'full_day') {
        // Full day unavailability affects all slots
        totalUnavailable += u.unavailableCount;
      } else if (u.type === 'time_slot' && u.timeSlots) {
        // Time slot unavailability only affects specific slots
        if (u.timeSlots.includes(time)) {
          totalUnavailable += u.unavailableCount;
        }
      }
    }

    return totalUnavailable;
  }

  /**
   * Check if a date has any unavailability (for calendar markers)
   */
  async hasUnavailability(date: string): Promise<boolean> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await StaffUnavailability.countDocuments({
      date: { $gte: targetDate, $lte: endOfDay },
    });

    return count > 0;
  }

  /**
   * Get dates with unavailability in a date range (for calendar display)
   */
  async getDatesWithUnavailability(startDate: string, endDate: string): Promise<string[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const unavailabilities = await StaffUnavailability.find({
      date: { $gte: start, $lte: end },
    }).distinct('date');

    return unavailabilities.map((d: Date) => d.toISOString().split('T')[0]);
  }

  /**
   * Format unavailability for response
   */
  private formatResponse(unavailability: IStaffUnavailability): IStaffUnavailabilityResponse {
    return {
      id: unavailability._id.toString(),
      date: unavailability.date.toISOString().split('T')[0],
      type: unavailability.type,
      timeSlots: unavailability.timeSlots,
      unavailableCount: unavailability.unavailableCount,
      reason: unavailability.reason,
      createdAt: unavailability.createdAt,
      updatedAt: unavailability.updatedAt,
    };
  }
}

export const unavailabilityService = new UnavailabilityService();
export default unavailabilityService;
