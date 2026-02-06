import { Router } from 'express';
import * as servicesController from '../../controllers/admin/services.controller.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  reorderServicesSchema,
} from '../../validators/admin.validator.js';

const router = Router();

// All routes require admin authentication and services permission
router.use(authenticateAdmin);
router.use(requirePermission('services'));

// Service routes
router.get('/', servicesController.getServices);
router.post('/', validate(createServiceSchema), servicesController.createService);
router.post('/reorder', validate(reorderServicesSchema), servicesController.reorderServices);
router.get('/:id', servicesController.getServiceById);
router.patch('/:id', validate(updateServiceSchema), servicesController.updateService);
router.delete('/:id', servicesController.deleteService);

export default router;
