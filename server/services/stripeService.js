import Stripe from 'stripe';
import { prisma } from '../db/connection.js';

// Initialize Stripe (will be null if no key)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Plan configuration
export const PLAN_LIMITS = {
  free: { athletes: 15, coaches: 1, features: ['basic'] },
  starter: { athletes: 30, coaches: 3, features: ['basic', 'ergData', 'lineups'] },
  pro: { athletes: 100, coaches: 10, features: ['all'] },
  enterprise: { athletes: -1, coaches: -1, features: ['all', 'api'] },
};

export const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

/**
 * Create a Stripe customer or return existing customer ID
 * @param {string} teamId - Team ID
 * @param {string} email - Customer email
 * @param {string} teamName - Team name for customer metadata
 * @returns {Promise<string>} Stripe customer ID
 */
export async function createOrGetCustomer(teamId, email, teamName) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Check if team already has a customer
  const subscription = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: teamName,
    metadata: {
      teamId,
    },
  });

  // Update or create subscription record with customer ID
  await prisma.subscription.upsert({
    where: { teamId },
    update: { stripeCustomerId: customer.id },
    create: {
      teamId,
      stripeCustomerId: customer.id,
      plan: 'free',
      status: 'active',
      athleteLimit: PLAN_LIMITS.free.athletes,
      coachLimit: PLAN_LIMITS.free.coaches,
    },
  });

  return customer.id;
}

/**
 * Create a Stripe checkout session for subscription
 * @param {string} teamId - Team ID
 * @param {string} priceId - Stripe price ID
 * @param {string} successUrl - URL to redirect on success
 * @param {string} cancelUrl - URL to redirect on cancel
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export async function createCheckoutSession(teamId, priceId, successUrl, cancelUrl) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get team info to create/get customer
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { role: 'OWNER' },
        include: { user: true },
        take: 1,
      },
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  const ownerEmail = team.members[0]?.user?.email;
  if (!ownerEmail) {
    throw new Error('Team owner email not found');
  }

  const customerId = await createOrGetCustomer(teamId, ownerEmail, team.name);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      teamId,
    },
    subscription_data: {
      metadata: {
        teamId,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create a billing portal session for managing subscription
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after portal
 * @returns {Promise<{url: string}>}
 */
export async function createPortalSession(customerId, returnUrl) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Get subscription from database
 * @param {string} teamId - Team ID
 * @returns {Promise<object|null>}
 */
export async function getSubscription(teamId) {
  return prisma.subscription.findUnique({
    where: { teamId },
  });
}

/**
 * Get subscription status with usage data for a team
 * @param {string} teamId - Team ID
 * @returns {Promise<object>}
 */
export async function getSubscriptionStatus(teamId) {
  const subscription = await getOrCreateSubscription(teamId);

  // Get usage counts
  const [athleteCount, coachCount] = await Promise.all([
    prisma.athlete.count({ where: { teamId } }),
    prisma.teamMembership.count({
      where: {
        teamId,
        role: { in: ['OWNER', 'ADMIN', 'COACH'] },
      },
    }),
  ]);

  const planLimits = PLAN_LIMITS[subscription.plan];

  return {
    data: {
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        athleteLimit: subscription.athleteLimit,
        coachLimit: subscription.coachLimit,
        features: planLimits.features,
      },
      usage: {
        athletes: {
          used: athleteCount,
          limit: subscription.athleteLimit,
        },
        coaches: {
          used: coachCount,
          limit: subscription.coachLimit,
        },
      },
    },
  };
}

/**
 * Get available subscription plans with pricing and features
 * @returns {Promise<object>}
 */
export async function getAvailablePlans() {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceId: null,
      interval: null,
      limits: PLAN_LIMITS.free,
      features: ['Up to 15 athletes', '1 coach', 'Basic lineup creation', 'Athlete profiles'],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      priceId: PLAN_PRICES.starter,
      interval: 'month',
      limits: PLAN_LIMITS.starter,
      features: [
        'Up to 30 athletes',
        '3 coaches',
        'Erg data tracking',
        'Lineup management',
        'Basic analytics',
        'Export to PDF',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      priceId: PLAN_PRICES.pro,
      interval: 'month',
      limits: PLAN_LIMITS.pro,
      features: [
        'Up to 100 athletes',
        '10 coaches',
        'All features',
        'Advanced analytics',
        'Seat racing analysis',
        'AI-powered insights',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null, // Custom pricing
      priceId: PLAN_PRICES.enterprise,
      interval: 'month',
      limits: PLAN_LIMITS.enterprise,
      features: [
        'Unlimited athletes',
        'Unlimited coaches',
        'All features',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Custom training',
      ],
    },
  ];

  return {
    data: {
      plans,
    },
  };
}

/**
 * Get or create default free subscription
 * @param {string} teamId - Team ID
 * @returns {Promise<object>}
 */
export async function getOrCreateSubscription(teamId) {
  const existing = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (existing) {
    return existing;
  }

  // Create default free subscription
  return prisma.subscription.create({
    data: {
      teamId,
      plan: 'free',
      status: 'active',
      athleteLimit: PLAN_LIMITS.free.athletes,
      coachLimit: PLAN_LIMITS.free.coaches,
    },
  });
}

/**
 * Update subscription from Stripe subscription object
 * @param {object} stripeSubscription - Stripe subscription object
 * @returns {Promise<object>}
 */
export async function updateSubscriptionFromStripe(stripeSubscription) {
  const teamId = stripeSubscription.metadata?.teamId;
  if (!teamId) {
    throw new Error('Team ID not found in subscription metadata');
  }

  // Determine plan from price ID
  let plan = 'free';
  const priceId = stripeSubscription.items?.data[0]?.price?.id;

  if (priceId === PLAN_PRICES.starter) {
    plan = 'starter';
  } else if (priceId === PLAN_PRICES.pro) {
    plan = 'pro';
  } else if (priceId === PLAN_PRICES.enterprise) {
    plan = 'enterprise';
  }

  const limits = PLAN_LIMITS[plan];

  // Map Stripe status to our status
  let status = 'active';
  if (stripeSubscription.status === 'past_due') {
    status = 'past_due';
  } else if (stripeSubscription.status === 'canceled' || stripeSubscription.status === 'unpaid') {
    status = 'canceled';
  } else if (stripeSubscription.status === 'trialing') {
    status = 'trialing';
  }

  const subscription = await prisma.subscription.upsert({
    where: { teamId },
    update: {
      stripeSubscriptionId: stripeSubscription.id,
      plan,
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      athleteLimit: limits.athletes,
      coachLimit: limits.coaches,
    },
    create: {
      teamId,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      plan,
      status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      athleteLimit: limits.athletes,
      coachLimit: limits.coaches,
    },
  });

  // Log subscription event
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: 'updated',
      data: {
        stripeStatus: stripeSubscription.status,
        plan,
        priceId,
      },
    },
  });

  return subscription;
}

/**
 * Cancel subscription
 * @param {string} teamId - Team ID
 * @param {boolean} atPeriodEnd - Cancel at period end (default true)
 * @returns {Promise<object>}
 */
export async function cancelSubscription(teamId, atPeriodEnd = true) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Cancel in Stripe
  let canceledSubscription;
  if (atPeriodEnd) {
    // Schedule cancellation at end of period
    canceledSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    // Cancel immediately
    canceledSubscription = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  }

  // Update local record
  const updated = await prisma.subscription.update({
    where: { teamId },
    data: {
      cancelAtPeriodEnd: atPeriodEnd,
      status: atPeriodEnd ? subscription.status : 'canceled',
    },
  });

  // Log cancellation event
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: 'canceled',
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        currentPeriodEnd: canceledSubscription.current_period_end,
      },
    },
  });

  return updated;
}

/**
 * Reactivate a canceled subscription (before period ends)
 * @param {string} teamId - Team ID
 * @returns {Promise<object>}
 */
export async function reactivateSubscription(teamId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { teamId },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No subscription found');
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  // Reactivate in Stripe by removing the cancel_at_period_end flag
  const reactivatedSubscription = await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    { cancel_at_period_end: false }
  );

  // Update local record
  const updated = await prisma.subscription.update({
    where: { teamId },
    data: {
      cancelAtPeriodEnd: false,
      status: 'active',
    },
  });

  // Log reactivation event
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      eventType: 'updated',
      data: {
        action: 'reactivated',
        currentPeriodEnd: reactivatedSubscription.current_period_end,
      },
    },
  });

  return updated;
}

/**
 * Handle Stripe webhook events
 * @param {object} event - Stripe webhook event
 * @returns {Promise<{handled: boolean, message: string}>}
 */
export async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const teamId = session.metadata?.teamId;

      if (!teamId) {
        return { handled: false, message: 'No teamId in session metadata' };
      }

      // Retrieve subscription to get full details
      if (session.subscription) {
        if (!stripe) {
          return { handled: false, message: 'Stripe is not configured' };
        }
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
        await updateSubscriptionFromStripe(stripeSubscription);

        // Log checkout completed event
        const subscription = await prisma.subscription.findUnique({
          where: { teamId },
        });

        if (subscription) {
          await prisma.subscriptionEvent.create({
            data: {
              subscriptionId: subscription.id,
              eventType: 'created',
              stripeEventId: event.id,
              data: {
                sessionId: session.id,
                subscriptionId: session.subscription,
              },
            },
          });
        }
      }

      return { handled: true, message: 'Checkout session completed' };
    }

    case 'customer.subscription.updated': {
      const stripeSubscription = event.data.object;
      await updateSubscriptionFromStripe(stripeSubscription);
      return { handled: true, message: 'Subscription updated' };
    }

    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object;
      const teamId = stripeSubscription.metadata?.teamId;

      if (!teamId) {
        return { handled: false, message: 'No teamId in subscription metadata' };
      }

      // Check if subscription exists before updating
      const existingSubscription = await prisma.subscription.findUnique({
        where: { teamId },
      });

      if (!existingSubscription) {
        return { handled: false, message: 'No subscription found for team' };
      }

      // Downgrade to free plan
      const subscription = await prisma.subscription.update({
        where: { teamId },
        data: {
          plan: 'free',
          status: 'canceled',
          stripeSubscriptionId: null,
          cancelAtPeriodEnd: false,
          athleteLimit: PLAN_LIMITS.free.athletes,
          coachLimit: PLAN_LIMITS.free.coaches,
        },
      });

      // Log deletion event
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          eventType: 'canceled',
          stripeEventId: event.id,
          data: {
            reason: 'subscription_deleted',
          },
        },
      });

      return { handled: true, message: 'Subscription deleted, downgraded to free' };
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) {
        return { handled: false, message: 'No subscription ID in invoice' };
      }

      // Find subscription by Stripe ID
      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'past_due' },
        });

        // Log payment failure
        await prisma.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            eventType: 'payment_failed',
            stripeEventId: event.id,
            data: {
              invoiceId: invoice.id,
              amountDue: invoice.amount_due,
              attemptCount: invoice.attempt_count,
            },
          },
        });
      }

      return { handled: true, message: 'Payment failure recorded' };
    }

    default:
      return { handled: false, message: `Unhandled event type: ${event.type}` };
  }
}

/**
 * Get plan limits for a given plan
 * @param {string} plan - Plan name (free, starter, pro, enterprise)
 * @returns {object}
 */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if team has access to a feature
 * @param {string} teamId - Team ID
 * @param {string} feature - Feature name to check
 * @returns {Promise<boolean>}
 */
export async function checkFeatureAccess(teamId, feature) {
  const subscription = await getOrCreateSubscription(teamId);
  const limits = PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free;

  // Check if features include 'all' or the specific feature
  return limits.features.includes('all') || limits.features.includes(feature);
}

export default {
  PLAN_LIMITS,
  PLAN_PRICES,
  createOrGetCustomer,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getSubscriptionStatus,
  getAvailablePlans,
  getOrCreateSubscription,
  updateSubscriptionFromStripe,
  cancelSubscription,
  reactivateSubscription,
  handleWebhookEvent,
  getPlanLimits,
  checkFeatureAccess,
};
