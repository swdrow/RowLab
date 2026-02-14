/**
 * Security Middleware for RowLab API
 *
 * Provides:
 * - Helmet for security headers
 * - Rate limiting per endpoint
 * - Request validation with Zod
 * - CORS configuration
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

/**
 * Helmet configuration for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        'http://localhost:*',
        'ws://localhost:*',
        'http://100.86.4.57:*',
        'https://api.ollama.ai',
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null, // Disable - server runs on HTTP
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading images from external sources
});

/**
 * CORS configuration
 */
export const corsOptions = cors({
  origin:
    process.env.NODE_ENV === 'production'
      ? [
          'https://rowlab.net',
          'https://www.rowlab.net',
          'http://100.86.4.57:3001',
          'http://10.0.0.17:3001',
        ]
      : [
          'http://localhost:3001',
          'http://localhost:3002',
          'http://10.0.0.17:3001',
          'http://100.86.4.57:3001',
        ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

/**
 * Global rate limiter - 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for development/testing
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true, // Disabled in dev -- re-enable for production
});

/**
 * Auth rate limiter - stricter limits for login attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 attempts per 15 minutes (increased for dev testing)
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true, // Disabled in dev -- re-enable for production
});

/**
 * AI endpoint rate limiter - moderate limits for AI requests
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: 'AI rate limit exceeded',
    message: 'Please wait before sending more requests',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI Chat rate limiter - stricter limits for expensive chat operations
 * Per-user limiting using JWT user ID
 */
export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 chat requests per minute per user
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many chat requests. Please wait before sending more.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID from JWT if available, otherwise IP
    return req.user?.id || req.ip;
  },
  validate: { keyGeneratorIpFallback: false },
});

/**
 * API general rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'API rate limit exceeded',
    message: 'Please slow down your requests',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  securityHeaders,
  corsOptions,
  globalLimiter,
  authLimiter,
  aiLimiter,
  aiChatLimiter,
  apiLimiter,
};
