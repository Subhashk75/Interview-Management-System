import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export { AppError };

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error(`[${req.method}] ${req.url} - ${err.message}`, { stack: err.stack });

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation error occurred', 400, 'VALIDATION_ERROR', formattedErrors);
    return;
  }

  // Handle Operational App Errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    sendError(res, `Duplicate entry for ${field}. A record with this value already exists.`, 409, 'DUPLICATE_KEY_ERROR');
    return;
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid authentication token', 401, 'INVALID_TOKEN');
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Authentication token has expired', 401, 'TOKEN_EXPIRED');
    return;
  }

  // Default 500
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
}
