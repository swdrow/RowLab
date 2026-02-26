/**
 * Request Validation Middleware using Zod
 *
 * Provides type-safe request validation for all API endpoints.
 */

import { z } from 'zod';

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  email: z.string().email('Invalid email address').optional().nullable(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  requestMessage: z
    .string()
    .max(500, 'Request message must be less than 500 characters')
    .optional(),
});

// =============================================================================
// LINEUP SCHEMAS
// =============================================================================

export const lineupSchema = z.object({
  name: z
    .string()
    .min(1, 'Lineup name is required')
    .max(100, 'Lineup name must be less than 100 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  boats: z.array(
    z.object({
      boatConfig: z.object({
        id: z.number(),
        name: z.string(),
        numSeats: z.number(),
        hasCoxswain: z.boolean(),
      }),
      shellName: z.string().optional(),
      seats: z.array(
        z.object({
          seatNumber: z.number(),
          side: z.enum(['Port', 'Starboard', 'N/A']),
          isCoxswain: z.boolean(),
          athlete: z
            .object({
              id: z.number(),
              lastName: z.string(),
              firstName: z.string(),
              country: z.string(),
              side: z.enum(['P', 'S', 'B', 'Cox']),
            })
            .nullable(),
        })
      ),
    })
  ),
});

export const lineupIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid lineup ID').transform(Number),
});

// =============================================================================
// ERG DATA SCHEMAS
// =============================================================================

export const ergTestSchema = z.object({
  athleteId: z.number().positive('Invalid athlete ID'),
  testDate: z.string().datetime({ message: 'Invalid date format' }).or(z.string().date()),
  testType: z.enum(['2k', '6k', '30min', '500m', '1k', '5k'], {
    errorMap: () => ({ message: 'Invalid test type' }),
  }),
  result: z.string().regex(/^\d{1,2}:\d{2}\.\d$/, 'Result must be in mm:ss.t format'),
  split: z
    .string()
    .regex(/^\d:\d{2}\.\d$/, 'Split must be in m:ss.t format')
    .optional(),
  strokeRate: z
    .number()
    .min(10, 'Stroke rate must be at least 10')
    .max(50, 'Stroke rate must be less than 50')
    .optional(),
  watts: z
    .number()
    .min(50, 'Watts must be at least 50')
    .max(1000, 'Watts must be less than 1000')
    .optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// =============================================================================
// AI SCHEMAS
// =============================================================================

export const aiChatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters'),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
  context: z
    .object({
      athletes: z
        .array(
          z.object({
            lastName: z.string(),
            firstName: z.string().optional(),
            side: z.string().optional(),
            ergScore: z.number().optional(),
            country: z.string().optional(),
          })
        )
        .optional(),
      activeBoats: z
        .array(
          z.object({
            boatConfig: z
              .object({
                name: z.string(),
              })
              .optional(),
            seats: z
              .array(
                z.object({
                  athlete: z.any().nullable(),
                })
              )
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const aiModelSchema = z.object({
  model: z
    .string()
    .min(1, 'Model name is required')
    .max(100, 'Model name must be less than 100 characters'),
});

// =============================================================================
// ATHLETE SCHEMAS
// =============================================================================

export const athleteSchema = z.object({
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  country: z.string().length(3, 'Country code must be 3 characters'),
  side: z.enum(['P', 'S', 'B', 'Cox'], {
    errorMap: () => ({ message: 'Side must be P, S, B, or Cox' }),
  }),
  port: z.boolean().optional().default(false),
  starboard: z.boolean().optional().default(false),
  sculling: z.boolean().optional().default(false),
  isCoxswain: z.boolean().optional().default(false),
});

// =============================================================================
// VALIDATION MIDDLEWARE FACTORY
// =============================================================================

/**
 * Creates a validation middleware for request body
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    // Replace body with parsed data (includes defaults and transformations)
    req.body = result.data;
    next();
  };
};

/**
 * Creates a validation middleware for request params
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid parameters',
          details: errors,
        },
      });
    }

    req.params = result.data;
    next();
  };
};

/**
 * Creates a validation middleware for request query
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid query parameters',
          details: errors,
        },
      });
    }

    req.query = result.data;
    next();
  };
};

export default {
  // Schemas
  loginSchema,
  registerSchema,
  lineupSchema,
  lineupIdSchema,
  ergTestSchema,
  aiChatSchema,
  aiModelSchema,
  athleteSchema,
  // Middleware factories
  validateBody,
  validateParams,
  validateQuery,
};
