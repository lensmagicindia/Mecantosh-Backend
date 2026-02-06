import Service from '../models/Service.model.js';
import { ApiError } from '../utils/ApiError.js';
import { IService, IServiceResponse } from '../interfaces/service.interface.js';

class ServiceCatalogService {
  /**
   * Get all active services
   */
  async getAllServices(): Promise<IServiceResponse[]> {
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1 });
    return services.map(this.formatServiceResponse);
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<IServiceResponse> {
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    return this.formatServiceResponse(service);
  }

  /**
   * Get service by slug
   */
  async getServiceBySlug(slug: string): Promise<IServiceResponse> {
    const service = await Service.findOne({ slug, isActive: true });
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    return this.formatServiceResponse(service);
  }

  /**
   * Format service for response
   */
  private formatServiceResponse(service: IService): IServiceResponse {
    const hours = Math.floor(service.durationMinutes / 60);
    const minutes = service.durationMinutes % 60;

    let durationFormatted: string;
    if (hours === 0) {
      durationFormatted = `${minutes} mins`;
    } else if (minutes === 0) {
      durationFormatted = hours === 1 ? '1 hour' : `${hours} hours`;
    } else {
      durationFormatted = `${hours}.${Math.round((minutes / 60) * 10)} hours`;
    }

    return {
      id: service._id.toString(),
      name: service.name,
      slug: service.slug,
      description: service.description,
      shortDescription: service.shortDescription,
      price: service.price,
      durationMinutes: service.durationMinutes,
      durationFormatted,
      category: service.category,
      features: service.features,
    };
  }
}

export const serviceCatalogService = new ServiceCatalogService();
export default serviceCatalogService;
