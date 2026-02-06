import mongoose from 'mongoose';
import Service from '../../models/Service.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { IService } from '../../interfaces/service.interface.js';

interface ServiceResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: number;
  durationMinutes: number;
  category: string;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

class AdminServicesService {
  /**
   * Get all services (including inactive)
   */
  async getAllServices(): Promise<ServiceResponse[]> {
    const services = await Service.find().sort({ sortOrder: 1, name: 1 });
    return services.map(this.formatServiceResponse);
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<ServiceResponse> {
    const service = await Service.findById(id);
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    return this.formatServiceResponse(service);
  }

  /**
   * Create a new service
   */
  async createService(data: {
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    duration?: number;
    durationMinutes?: number;
    category?: string;
    features?: string[];
    isActive?: boolean;
  }): Promise<ServiceResponse> {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug exists
    const existingService = await Service.findOne({ slug });
    if (existingService) {
      throw ApiError.conflict('A service with this name already exists');
    }

    // Get the highest sortOrder
    const highestOrder = await Service.findOne().sort({ sortOrder: -1 });
    const sortOrder = highestOrder ? highestOrder.sortOrder + 1 : 0;

    const service = await Service.create({
      name: data.name,
      slug,
      description: data.description,
      shortDescription: data.shortDescription || data.description.substring(0, 150),
      price: data.price,
      durationMinutes: data.durationMinutes || data.duration || 60,
      category: data.category || 'basic',
      features: data.features || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      sortOrder,
    });

    return this.formatServiceResponse(service);
  }

  /**
   * Update a service
   */
  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      shortDescription?: string;
      price?: number;
      duration?: number;
      durationMinutes?: number;
      category?: string;
      features?: string[];
      isActive?: boolean;
      displayOrder?: number;
      sortOrder?: number;
    }
  ): Promise<ServiceResponse> {
    const service = await Service.findById(id);
    if (!service) {
      throw ApiError.notFound('Service not found');
    }

    // If name is being changed, update slug
    if (data.name && data.name !== service.name) {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingService = await Service.findOne({ slug, _id: { $ne: id } });
      if (existingService) {
        throw ApiError.conflict('A service with this name already exists');
      }
      service.slug = slug;
      service.name = data.name;
    }

    if (data.description !== undefined) service.description = data.description;
    if (data.shortDescription !== undefined) service.shortDescription = data.shortDescription;
    if (data.price !== undefined) service.price = data.price;
    if (data.durationMinutes !== undefined) service.durationMinutes = data.durationMinutes;
    if (data.duration !== undefined) service.durationMinutes = data.duration;
    if (data.category !== undefined) service.category = data.category as 'basic' | 'premium' | 'detailing';
    if (data.features !== undefined) service.features = data.features;
    if (data.isActive !== undefined) service.isActive = data.isActive;
    if (data.sortOrder !== undefined) service.sortOrder = data.sortOrder;
    if (data.displayOrder !== undefined) service.sortOrder = data.displayOrder;

    await service.save();

    return this.formatServiceResponse(service);
  }

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    const service = await Service.findById(id);
    if (!service) {
      throw ApiError.notFound('Service not found');
    }

    await Service.deleteOne({ _id: id });
  }

  /**
   * Reorder services
   */
  async reorderServices(orderedIds: string[]): Promise<ServiceResponse[]> {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { sortOrder: index } },
      },
    }));

    await Service.bulkWrite(bulkOps);

    return this.getAllServices();
  }

  /**
   * Format service for response
   */
  private formatServiceResponse(service: IService): ServiceResponse {
    return {
      id: service._id.toString(),
      name: service.name,
      slug: service.slug,
      description: service.description,
      shortDescription: service.shortDescription,
      price: service.price,
      duration: service.durationMinutes,
      durationMinutes: service.durationMinutes,
      category: service.category,
      features: service.features,
      isActive: service.isActive,
      displayOrder: service.sortOrder,
      sortOrder: service.sortOrder,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

export const adminServicesService = new AdminServicesService();
export default adminServicesService;
