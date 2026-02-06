import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { UPLOAD_LIMITS } from '../utils/constants.js';
import { config } from '../config/index.js';

// Check if using S3 storage
const useS3 = config.storage.type === 's3';

// Disk storage configuration (for local storage)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    // Determine upload directory based on field name or route
    if (file.fieldname === 'profileImage' || req.path.includes('profile-image')) {
      uploadPath = 'uploads/profiles/';
    } else if (file.fieldname === 'vehicleImage' || req.path.includes('vehicles')) {
      uploadPath = 'uploads/vehicles/';
    }

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Memory storage configuration (for S3 uploads)
const memoryStorage = multer.memoryStorage();

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG and WebP images are allowed'));
  }
};

// Create multer instance with appropriate storage
export const upload = multer({
  storage: useS3 ? memoryStorage : diskStorage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE, // 5MB
  },
});

// Middleware for single image upload
export const uploadSingleImage = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple images
export const uploadMultipleImages = (fieldName: string, maxCount: number) =>
  upload.array(fieldName, maxCount);

// Error handler for multer
export const handleMulterError = (error: any): ApiError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(400, 'File size exceeds the 5MB limit');
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(400, 'Unexpected file field');
  }
  return new ApiError(400, error.message || 'Error uploading file');
};

// Helper to check if using S3
export const isUsingS3 = (): boolean => useS3;
