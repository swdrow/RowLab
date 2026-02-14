import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { rfc7807ErrorHandler } from '../../middleware/rfc7807.js';
import statsRouter from './stats.js';
import workoutsRouter from './workouts.js';
import prsRouter from './prs.js';
import dashboardRouter from './dashboard.js';
import profileRouter from './profile.js';

const router = express.Router();

// All /api/u/* routes require authentication but NOT team context
router.use(authenticateToken);

// Sub-routers
router.use('/profile', profileRouter);
router.use('/stats', statsRouter);
router.use('/workouts', workoutsRouter);
router.use('/prs', prsRouter);
router.use('/dashboard', dashboardRouter);

// Health check
router.get('/ping', (req, res) => {
  res.json({ success: true, data: { userId: req.user.id, message: 'User-scoped API active' } });
});

// RFC 7807 error handler for all /api/u/* errors
router.use(rfc7807ErrorHandler);

export default router;
