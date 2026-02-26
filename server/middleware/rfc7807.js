import http from 'http';

/**
 * Custom API error with RFC 7807 Problem Details fields.
 * Throw this from route handlers for structured error responses.
 */
export class ApiError extends Error {
  constructor(status, code, detail, title) {
    super(detail);
    this.statusCode = status;
    this.code = code;
    this.title = title || null;
  }
}

/**
 * Express error middleware that formats errors as RFC 7807 Problem Details JSON.
 * Only used for /api/u/* routes. Existing /api/v1/ errors stay as-is.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
export function rfc7807ErrorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    type: `/errors/${err.code || 'internal-error'}`,
    title: err.title || http.STATUS_CODES[status],
    status,
    detail: err.message || 'An unexpected error occurred',
    instance: req.originalUrl,
  });
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
