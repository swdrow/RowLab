/**
 * Winston Logger Configuration for oarbit
 *
 * Provides structured logging with:
 * - Console output for development
 * - File output for production
 * - Request logging middleware
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr ? '\n' + metaStr : ''}${stackStr}`;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'oarbit-api' },
  transports: [],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      devFormat
    ),
  }));
} else {
  // Production: JSON format to console (for container logs)
  logger.add(new winston.transports.Console({
    format: combine(json()),
  }));

  // Production: also log to files
  const logsDir = path.join(__dirname, '../../logs');

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: combine(json()),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: combine(json()),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

/**
 * Express request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Add user info if authenticated
    if (req.user) {
      logData.userId = req.user.id;
      logData.username = req.user.username;
    }

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Error logging middleware (use after routes)
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
    userId: req.user?.id,
  });

  next(err);
};

export default logger;
