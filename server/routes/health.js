import express from 'express';
import prisma from '../db/connection.js';

const router = express.Router();

/**
 * GET / or GET /health - Basic liveness check
 * Always returns 200 if server is running
 */
router.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /ready - Readiness check
 * Checks database connection and Redis if configured
 * Returns 200 if all healthy, 503 if any unhealthy
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: { status: 'unknown' },
    redis: { status: 'unknown' }
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
  }

  // Check Redis if configured
  if (process.env.REDIS_URL) {
    try {
      // Redis check would go here if Redis client is available
      // For now, mark as not configured
      checks.redis = { status: 'not_configured' };
    } catch (error) {
      checks.redis = { status: 'error', message: error.message };
    }
  } else {
    checks.redis = { status: 'not_configured' };
  }

  // Determine overall health status
  const dbHealthy = checks.database.status === 'ok';
  const redisHealthy = checks.redis.status === 'ok' || checks.redis.status === 'not_configured';

  let status;
  if (dbHealthy && redisHealthy) {
    status = 'ok';
  } else if (dbHealthy || redisHealthy) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const httpStatus = status === 'unhealthy' ? 503 : (status === 'degraded' ? 503 : 200);

  res.status(httpStatus).json({
    status,
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /startup - Startup probe
 * Used by Kubernetes to know when app is ready to receive traffic
 * Similar to ready check but may have different timeout considerations
 */
router.get('/startup', async (req, res) => {
  const checks = {
    database: { status: 'unknown' }
  };

  try {
    // Check database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
  }

  const isReady = checks.database.status === 'ok';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ok' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /version - Return app version information
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    version: process.env.npm_package_version || 'dev',
    node: process.version,
    timestamp: new Date().toISOString()
  });
});

export default router;
