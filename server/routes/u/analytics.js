import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/connection.js';
import {
  getAnalyticsPMC,
  getAnalyticsVolume,
  deriveInsights,
} from '../../services/analyticsService.js';

const router = express.Router();

const VALID_PMC_RANGES = ['30d', '90d', '180d', '365d', 'all'];
const VALID_VOL_RANGES = ['4w', '12w', '6m', '1y'];
const VALID_GRANULARITIES = ['weekly', 'monthly'];
const VALID_METRICS = ['distance', 'duration'];

// GET /api/u/analytics/pmc
router.get('/pmc', async (req, res, next) => {
  try {
    const range = req.query.range || '90d';
    if (!VALID_PMC_RANGES.includes(range)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RANGE', message: `Invalid range: ${range}` },
      });
    }
    const sport = req.query.sport || null;
    const data = await getAnalyticsPMC(req.user.id, range, sport);
    const insights = deriveInsights(data, data._settings);

    // Check if user has configured any custom analytics thresholds
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
      select: { maxHeartRate: true, lactateThresholdHR: true, functionalThresholdPower: true },
    });
    const hasCustomSettings = !!(
      userSettings?.maxHeartRate ||
      userSettings?.lactateThresholdHR ||
      userSettings?.functionalThresholdPower
    );

    // Remove internal _settings from response
    const { _settings, ...responseData } = data;

    res.json({ success: true, data: { ...responseData, insights, hasCustomSettings } });
  } catch (err) {
    next(err);
  }
});

// GET /api/u/analytics/volume
router.get('/volume', async (req, res, next) => {
  try {
    const range = req.query.range || '12w';
    if (!VALID_VOL_RANGES.includes(range)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RANGE', message: `Invalid range: ${range}` },
      });
    }
    const granularity = req.query.granularity || 'weekly';
    if (!VALID_GRANULARITIES.includes(granularity)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_GRANULARITY', message: `Invalid granularity: ${granularity}` },
      });
    }
    const metric = req.query.metric || 'distance';
    if (!VALID_METRICS.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_METRIC', message: `Invalid metric: ${metric}` },
      });
    }
    const data = await getAnalyticsVolume(req.user.id, range, granularity, metric);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/u/analytics/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
      select: {
        dateOfBirth: true,
        maxHeartRate: true,
        lactateThresholdHR: true,
        functionalThresholdPower: true,
        tsbAlertThreshold: true,
        acwrAlertThreshold: true,
      },
    });
    res.json({ success: true, data: settings || {} });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/u/analytics/settings
router.patch('/settings', async (req, res, next) => {
  try {
    const {
      dateOfBirth,
      maxHeartRate,
      lactateThresholdHR,
      functionalThresholdPower,
      tsbAlertThreshold,
      acwrAlertThreshold,
    } = req.body;

    // Build update payload (only include provided fields)
    const updateData = {};
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (maxHeartRate !== undefined) {
      updateData.maxHeartRate = maxHeartRate != null ? Number(maxHeartRate) : null;
    }
    if (lactateThresholdHR !== undefined) {
      updateData.lactateThresholdHR =
        lactateThresholdHR != null ? Number(lactateThresholdHR) : null;
    }
    if (functionalThresholdPower !== undefined) {
      updateData.functionalThresholdPower =
        functionalThresholdPower != null ? Number(functionalThresholdPower) : null;
    }
    if (tsbAlertThreshold !== undefined) {
      updateData.tsbAlertThreshold = tsbAlertThreshold != null ? Number(tsbAlertThreshold) : null;
    }
    if (acwrAlertThreshold !== undefined) {
      updateData.acwrAlertThreshold =
        acwrAlertThreshold != null ? new Prisma.Decimal(acwrAlertThreshold) : null;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: updateData,
      create: {
        userId: req.user.id,
        ...updateData,
      },
    });

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

export default router;
