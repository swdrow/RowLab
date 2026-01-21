import express from 'express';
import { authenticateToken, requireRole, requireTeam } from '../middleware/auth.js';
import * as stripeService from '../services/stripeService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Webhook needs raw body and no auth - must be BEFORE authenticateToken middleware
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    try {
      const result = await stripeService.handleWebhookEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      res.json({ received: true, ...result });
    } catch (error) {
      logger.error('Webhook error', { error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
);

// All other routes need auth
router.use(authenticateToken, requireTeam);

// GET / - Get team's subscription status
router.get('/', async (req, res) => {
  try {
    const subscription = await stripeService.getSubscriptionStatus(req.user.activeTeamId);
    res.json(subscription);
  } catch (error) {
    logger.error('Get subscription error', { error: error.message });
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// GET /plans - List available plans with pricing (public info but requires auth for team context)
router.get('/plans', async (req, res) => {
  try {
    const plans = await stripeService.getAvailablePlans();
    res.json(plans);
  } catch (error) {
    logger.error('Get plans error', { error: error.message });
    res.status(500).json({ error: 'Failed to get available plans' });
  }
});

// POST /checkout - Create Stripe checkout session
router.post('/checkout', requireRole(['OWNER']), async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/billing?success=true`;
    const defaultCancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/billing?canceled=true`;

    const { url } = await stripeService.createCheckoutSession(
      req.user.activeTeamId,
      priceId,
      successUrl || defaultSuccessUrl,
      cancelUrl || defaultCancelUrl
    );

    res.json({ url });
  } catch (error) {
    logger.error('Create checkout session error', { error: error.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /portal - Create billing portal session
router.post('/portal', requireRole(['OWNER']), async (req, res) => {
  try {
    const { returnUrl } = req.body;

    const defaultReturnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/billing`;

    // Get the subscription to retrieve the Stripe customer ID
    const subscription = await stripeService.getSubscription(req.user.activeTeamId);

    if (!subscription?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this team' });
    }

    const { url } = await stripeService.createPortalSession(
      subscription.stripeCustomerId,
      returnUrl || defaultReturnUrl
    );

    res.json({ url });
  } catch (error) {
    logger.error('Create portal session error', { error: error.message });
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// POST /cancel - Cancel subscription
router.post('/cancel', requireRole(['OWNER']), async (req, res) => {
  try {
    const { atPeriodEnd = true } = req.body;

    const subscription = await stripeService.cancelSubscription(
      req.user.activeTeamId,
      atPeriodEnd
    );

    res.json(subscription);
  } catch (error) {
    logger.error('Cancel subscription error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// POST /reactivate - Reactivate a canceled subscription
router.post('/reactivate', requireRole(['OWNER']), async (req, res) => {
  try {
    const subscription = await stripeService.reactivateSubscription(req.user.activeTeamId);
    res.json(subscription);
  } catch (error) {
    logger.error('Reactivate subscription error', { error: error.message });
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

export default router;
