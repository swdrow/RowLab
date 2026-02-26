/**
 * Centralized error handling utilities for the oarbit API.
 *
 * Provides:
 * - AppError class for typed, envelope-compatible errors
 * - ErrorCodes catalog for consistent error code usage
 * - Factory functions for common error scenarios
 */

/**
 * Application error with structured fields for the API envelope.
 * Caught by envelopeErrorHandler middleware to produce consistent
 * { success: false, error: { code, message, details? } } responses.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code (e.g., 'NOT_FOUND')
   * @param {string} message - Human-readable error message
   * @param {Array<{field: string, message: string}>} [details] - Field-level validation errors
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details || undefined;
    this.isOperational = true;

    // Capture stack trace, excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Core error code catalog.
 * Covers ~95% of API error cases. New codes can be added as needed.
 */
export const ErrorCodes = Object.freeze({
  // Authentication
  AUTH_REQUIRED: { status: 401, code: 'AUTH_REQUIRED' },
  AUTH_EXPIRED: { status: 401, code: 'AUTH_EXPIRED' },

  // Authorization
  FORBIDDEN: { status: 403, code: 'FORBIDDEN' },

  // Resource errors
  NOT_FOUND: { status: 404, code: 'NOT_FOUND' },
  CONFLICT: { status: 409, code: 'CONFLICT' },

  // Input errors
  VALIDATION_FAILED: { status: 400, code: 'VALIDATION_FAILED' },
  INVALID_INPUT: { status: 400, code: 'INVALID_INPUT' },

  // Context errors
  NO_TEAM: { status: 400, code: 'NO_TEAM' },

  // Rate limiting
  RATE_LIMITED: { status: 429, code: 'RATE_LIMITED' },

  // Server errors
  SERVER_ERROR: { status: 500, code: 'SERVER_ERROR' },
  SERVICE_UNAVAILABLE: { status: 503, code: 'SERVICE_UNAVAILABLE' },
});

// ---------------------------------------------------------------------------
// Factory functions for common error scenarios
// ---------------------------------------------------------------------------

/**
 * Create a 404 Not Found error.
 * @param {string} [message='Resource not found']
 * @returns {AppError}
 */
export function notFound(message = 'Resource not found') {
  return new AppError(404, 'NOT_FOUND', message);
}

/**
 * Create a 403 Forbidden error.
 * @param {string} [message='Insufficient permissions']
 * @returns {AppError}
 */
export function forbidden(message = 'Insufficient permissions') {
  return new AppError(403, 'FORBIDDEN', message);
}

/**
 * Create a 400 Validation Failed error with field-level details.
 * @param {Array<{field: string, message: string}>} details - Per-field errors
 * @param {string} [message='Validation failed']
 * @returns {AppError}
 */
export function validationFailed(details, message = 'Validation failed') {
  return new AppError(400, 'VALIDATION_FAILED', message, details);
}

/**
 * Create a 409 Conflict error.
 * @param {string} [message='Resource conflict']
 * @returns {AppError}
 */
export function conflict(message = 'Resource conflict') {
  return new AppError(409, 'CONFLICT', message);
}

/**
 * Create a 400 Invalid Input error.
 * @param {string} message - Description of the invalid input
 * @returns {AppError}
 */
export function invalidInput(message) {
  return new AppError(400, 'INVALID_INPUT', message);
}

/**
 * Create a 503 Service Unavailable error.
 * @param {string} [message='Service temporarily unavailable']
 * @returns {AppError}
 */
export function serviceUnavailable(message = 'Service temporarily unavailable') {
  return new AppError(503, 'SERVICE_UNAVAILABLE', message);
}
