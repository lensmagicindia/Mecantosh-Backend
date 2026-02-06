import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

interface MongooseError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
      stack: config.nodeEnv === 'development' ? err.stack : undefined,
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.message,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // Mongoose duplicate key error
  const mongooseErr = err as MongooseError;
  if (mongooseErr.code === 11000) {
    const field = Object.keys(mongooseErr.keyValue || {})[0];
    res.status(409).json({
      success: false,
      message: `${field ? `${field} already exists` : 'Duplicate entry'}`,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
