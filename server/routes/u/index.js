import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';

import statsRouter from './stats.js';
import workoutsRouter from './workouts.js';
import prsRouter from './prs.js';
import dashboardRouter from './dashboard.js';
import profileRouter from './profile.js';
import achievementsRouter from './achievements.js';
import teamRoutes from '../teams.js';
import analyticsRouter from './analytics.js';
import feedRouter from './feed.js';

const router = express.Router();

// All /api/u/* routes require authentication but NOT team context
router.use(authenticateToken);

// Sub-routers
router.use('/profile', profileRouter);
router.use('/achievements', achievementsRouter);
router.use('/stats', statsRouter);
router.use('/workouts', workoutsRouter);
router.use('/prs', prsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/teams', teamRoutes);
router.use('/analytics', analyticsRouter);
router.use('/feed', feedRouter);

// Health check
router.get('/ping', (req, res) => {
  res.json({ success: true, data: { userId: req.user.id, message: 'User-scoped API active' } });
});

// Errors flow to global envelopeErrorHandler in server/index.js

export default router;
