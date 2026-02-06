import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';

const router = Router();

// Public routes
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);

export default router;
