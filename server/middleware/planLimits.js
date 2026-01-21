import prisma from '../db/connection.js';
import { PLAN_LIMITS, getOrCreateSubscription } from '../services/stripeService.js';

/**
 * Middleware to check athlete count before creating a new athlete
 * Returns 403 if team has reached their plan's athlete limit
 */
export const checkAthleteLimit = async (req, res, next) => {
  try {
    const teamId = req.user.activeTeamId;
    const subscription = await getOrCreateSubscription(teamId);
    const limits = PLAN_LIMITS[subscription.plan];

    if (!limits) {
      return res.status(500).json({
        success: false,
        error: 'Invalid subscription plan configuration',
        code: 'INVALID_PLAN',
      });
    }

    if (limits.athletes === -1) return next(); // Unlimited

    const count = await prisma.athlete.count({ where: { teamId } });

    if (count >= limits.athletes) {
      return res.status(403).json({
        success: false,
        error: 'Athlete limit reached',
        code: 'LIMIT_REACHED',
        limit: limits.athletes,
        current: count,
        plan: subscription.plan,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check coach/team member count before adding a new member
 * Returns 403 if team has reached their plan's coach limit
 */
export const checkCoachLimit = async (req, res, next) => {
  try {
    const teamId = req.user.activeTeamId;
    const subscription = await getOrCreateSubscription(teamId);
    const limits = PLAN_LIMITS[subscription.plan];

    if (!limits) {
      return res.status(500).json({
        success: false,
        error: 'Invalid subscription plan configuration',
        code: 'INVALID_PLAN',
      });
    }

    if (limits.coaches === -1) return next(); // Unlimited

    const count = await prisma.teamMember.count({
      where: {
        teamId,
        role: { in: ['HEAD_COACH', 'ASSISTANT_COACH', 'COACH'] },
      },
    });

    if (count >= limits.coaches) {
      return res.status(403).json({
        success: false,
        error: 'Coach limit reached',
        code: 'LIMIT_REACHED',
        limit: limits.coaches,
        current: count,
        plan: subscription.plan,
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Factory function that returns middleware to check if a feature is available on the current plan
 * @param {string} feature - The feature name to check
 * @returns {Function} Express middleware function
 */
export const requireFeature = (feature) => async (req, res, next) => {
  try {
    const teamId = req.user.activeTeamId;
    const subscription = await getOrCreateSubscription(teamId);
    const limits = PLAN_LIMITS[subscription.plan];

    if (!limits) {
      return res.status(500).json({
        success: false,
        error: 'Invalid subscription plan configuration',
        code: 'INVALID_PLAN',
      });
    }

    const features = Array.isArray(limits.features) ? limits.features : [];

    if (features.includes('all') || features.includes(feature)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Feature '${feature}' not available on current plan`,
      code: 'FEATURE_LOCKED',
      feature,
      plan: subscription.plan,
      upgradeRequired: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to attach subscription info to the request object
 * Makes subscription available as req.subscription for downstream handlers
 */
export const attachSubscription = async (req, res, next) => {
  try {
    if (req.user?.activeTeamId) {
      req.subscription = await getOrCreateSubscription(req.user.activeTeamId);
    }
    next();
  } catch (error) {
    next(error);
  }
};
