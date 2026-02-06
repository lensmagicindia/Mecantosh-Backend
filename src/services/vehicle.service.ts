import Vehicle from '../models/Vehicle.model.js';
import { ApiError } from '../utils/ApiError.js';
import { IVehicle, IVehicleResponse, VehicleType } from '../interfaces/vehicle.interface.js';
import { s3Service } from './s3.service.js';
import fs from 'fs/promises';

interface CreateVehicleData {
  name: string;
  licensePlate: string;
  make?: string;
  vehicleModel?: string;
  year?: number;
  color?: string;
  vehicleType?: VehicleType;
}

class VehicleService {
  /**
   * Get all vehicles for a user
   */
  async getUserVehicles(userId: string): Promise<{ vehicles: IVehicleResponse[]; total: number }> {
    const vehicles = await Vehicle.find({ user: userId, isActive: true }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return {
      vehicles: vehicles.map(this.formatVehicleResponse),
      total: vehicles.length,
    };
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(vehicleId: string, userId: string): Promise<IVehicleResponse> {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
      isActive: true,
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    return this.formatVehicleResponse(vehicle);
  }

  /**
   * Create new vehicle
   */
  async createVehicle(userId: string, data: CreateVehicleData): Promise<IVehicleResponse> {
    // Check if this is the first vehicle (make it default)
    const existingVehicles = await Vehicle.countDocuments({ user: userId, isActive: true });
    const isDefault = existingVehicles === 0;

    const vehicle = await Vehicle.create({
      user: userId,
      name: data.name,
      licensePlate: data.licensePlate.toUpperCase(),
      make: data.make,
      vehicleModel: data.vehicleModel,
      year: data.year,
      color: data.color,
      vehicleType: data.vehicleType || 'sedan',
      isDefault,
    });

    return this.formatVehicleResponse(vehicle);
  }

  /**
   * Update vehicle
   */
  async updateVehicle(
    vehicleId: string,
    userId: string,
    data: Partial<CreateVehicleData>
  ): Promise<IVehicleResponse> {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
      isActive: true,
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Update fields
    if (data.name) vehicle.name = data.name;
    if (data.licensePlate) vehicle.licensePlate = data.licensePlate.toUpperCase();
    if (data.make !== undefined) vehicle.make = data.make;
    if (data.vehicleModel !== undefined) vehicle.vehicleModel = data.vehicleModel;
    if (data.year !== undefined) vehicle.year = data.year;
    if (data.color !== undefined) vehicle.color = data.color;
    if (data.vehicleType) vehicle.vehicleType = data.vehicleType;

    await vehicle.save();
    return this.formatVehicleResponse(vehicle);
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(vehicleId: string, userId: string): Promise<void> {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
      isActive: true,
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Delete image if exists
    if (vehicle.image) {
      await this.deleteImageFile(vehicle.image);
    }

    // Soft delete
    vehicle.isActive = false;
    await vehicle.save();

    // If this was the default, set another as default
    if (vehicle.isDefault) {
      const anotherVehicle = await Vehicle.findOne({
        user: userId,
        isActive: true,
        _id: { $ne: vehicleId }, // Exclude the deleted vehicle
      });
      if (anotherVehicle) {
        anotherVehicle.isDefault = true;
        await anotherVehicle.save();
      }
    }
  }

  /**
   * Upload vehicle image
   */
  async uploadImage(vehicleId: string, userId: string, imagePath: string): Promise<IVehicleResponse> {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
      isActive: true,
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Delete old image if exists
    if (vehicle.image) {
      await this.deleteImageFile(vehicle.image);
    }

    vehicle.image = imagePath;
    await vehicle.save();

    return this.formatVehicleResponse(vehicle);
  }

  /**
   * Delete image file (handles both local and S3)
   */
  private async deleteImageFile(imagePath: string): Promise<void> {
    try {
      if (s3Service.isS3Url(imagePath)) {
        // Delete from S3
        await s3Service.deleteFile(imagePath);
      } else {
        // Delete local file
        await fs.unlink(imagePath);
      }
    } catch {
      // Ignore deletion errors
    }
  }

  /**
   * Set vehicle as default
   */
  async setDefault(vehicleId: string, userId: string): Promise<IVehicleResponse> {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      user: userId,
      isActive: true,
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    // Remove default from other vehicles
    await Vehicle.updateMany(
      { user: userId, isDefault: true },
      { isDefault: false }
    );

    // Set this as default
    vehicle.isDefault = true;
    await vehicle.save();

    return this.formatVehicleResponse(vehicle);
  }

  /**
   * Format vehicle for response
   */
  private formatVehicleResponse(vehicle: IVehicle): IVehicleResponse {
    return {
      id: vehicle._id.toString(),
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      vehicleModel: vehicle.vehicleModel,
      year: vehicle.year,
      color: vehicle.color,
      vehicleType: vehicle.vehicleType,
      image: vehicle.image,
      isDefault: vehicle.isDefault,
      createdAt: vehicle.createdAt,
    };
  }
}

export const vehicleService = new VehicleService();
export default vehicleService;
