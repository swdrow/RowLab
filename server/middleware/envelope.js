/**
 * API Response Envelope Middleware
 *
 * Provides consistent response format for all API endpoints:
 * - Success: { success: true, data: T }
 * - Paginated: { success: true, data: T[], meta: { total, page, limit, hasMore } }
 * - Error: { success: false, error: { code, message, details? } }
 */

import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Send a success response with the standard envelope.
 *
 * @param {import('express').Response} res
 * @param {*} data - The response payload
 * @param {number} [status=200] - HTTP status code
 */
export function envelopeSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

/**
 * Send a paginated success response with the standard envelope + meta.
 *
 * @param {import('express').Response} res
 * @param {Array} data - The list of items
 * @param {{ total: number, page: number, limit: number, hasMore: boolean }} meta - Pagination metadata
 */
export function envelopePaginatedSuccess(res, data, meta) {
  res.json({ success: true, data, meta });
}

/**
 * Global Express error handler that formats all errors as the standard envelope.
 *
 * Catches:
 * - AppError instances (operational errors with code/message)
 * - Generic Error instances (unexpected errors -> SERVER_ERROR)
 *
 * Must be registered AFTER all routes as Express error middleware (4 args).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function envelopeErrorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status and error shape
  let status;
  let errorBody;

  if (err instanceof AppError) {
    status = err.statusCode;
    errorBody = {
      code: err.code,
      message: err.message,
    };
    if (err.details) {
      errorBody.details = err.details;
    }
  } else {
    // Unexpected error -- treat as SERVER_ERROR
    status = err.statusCode || err.status || 500;
    errorBody = {
      code: 'SERVER_ERROR',
      message: status < 500 ? err.message : 'An unexpected error occurred',
    };
  }

  // Log 500-level errors
  if (status >= 500) {
    logger.error('Unhandled API error', {
      code: errorBody.code,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Include debug info in non-production environments
  const response = { success: false, error: errorBody };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response._debug = { stack: err.stack };
  }

  res.status(status).json(response);
}
