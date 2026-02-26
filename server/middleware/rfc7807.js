/**
 * Legacy RFC 7807 module.
 *
 * The rfc7807ErrorHandler is DEPRECATED -- errors now flow through
 * the global envelopeErrorHandler in server/middleware/envelope.js.
 *
 * ApiError is re-exported as a backward-compatible alias for AppError.
 * Existing `throw new ApiError(status, code, detail)` calls in /api/u/
 * routes continue to work because AppError is caught by envelopeErrorHandler.
 *
 * mapSourceForApi is unrelated to error handling and still in use.
 */

// Backward-compatible re-export: ApiError -> AppError
// The ApiError constructor signature was: (status, code, detail, title)
// AppError constructor signature is: (statusCode, code, message, details)
// Both share (status, code, message) in positions 1-3, so existing callers work.
export { AppError as ApiError } from '../utils/errors.js';

/**
 * @deprecated Use envelopeErrorHandler from server/middleware/envelope.js instead.
 */
export function rfc7807ErrorHandler(err, req, res, next) {
  // Pass through to global error handler
  next(err);
}

/**
 * Map DB source values to simplified API source enum.
 * DB stores detailed source values; API returns simplified values.
 *
 * @param {string} dbSource - Database source value
 * @returns {string} - API source value: 'manual' | 'concept2' | 'strava' | 'garmin'
 */
export function mapSourceForApi(dbSource) {
  const mapping = {
    manual: 'manual',
    concept2_sync: 'concept2',
    csv_import: 'manual',
    bluetooth: 'manual',
    fit_import: 'garmin',
    garmin_sync: 'garmin',
    strava_sync: 'strava',
  };
  return mapping[dbSource] || 'manual';
}
