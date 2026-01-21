import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Users,
  UserCog,
  BarChart3,
  Ship,
  Brain,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Crown,
  Sparkles,
  Shield,
  RefreshCw,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import SpotlightCard from '../components/ui/SpotlightCard';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

// Plan badge colors (Precision Instrument palette)
const planColors = {
  free: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  starter: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
  pro: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  enterprise: 'bg-warning-orange/10 text-warning-orange border-warning-orange/20',
};

// Status badge colors
const statusColors = {
  active: 'bg-blade-blue/10 text-blade-blue border-blade-blue/20',
  trialing: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/20',
  past_due: 'bg-danger-red/10 text-danger-red border-danger-red/20',
  canceled: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  incomplete: 'bg-warning-orange/10 text-warning-orange border-warning-orange/20',
};

// Default plans
const defaultPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      athletes: 15,
      coaches: 1,
      ergData: true,
      lineups: 3,
      aiFeatures: false,
      seatRacing: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    priceId: 'price_starter_monthly',
    features: {
      athletes: 50,
      coaches: 3,
      ergData: true,
      lineups: 10,
      aiFeatures: false,
      seatRacing: true,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    interval: 'month',
    priceId: 'price_pro_monthly',
    popular: true,
    features: {
      athletes: -1,
      coaches: 10,
      ergData: true,
      lineups: -1,
      aiFeatures: true,
      seatRacing: true,
      advancedAnalytics: true,
      prioritySupport: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    interval: 'month',
    features: {
      athletes: -1,
      coaches: -1,
      ergData: true,
      lineups: -1,
      aiFeatures: true,
      seatRacing: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
];

// Feature definitions
const featureDefinitions = [
  { key: 'athletes', label: 'Athletes', icon: Users },
  { key: 'coaches', label: 'Coaches', icon: UserCog },
  { key: 'ergData', label: 'Erg Data Import', icon: BarChart3 },
  { key: 'lineups', label: 'Saved Lineups', icon: Ship },
  { key: 'seatRacing', label: 'Seat Racing', icon: RefreshCw },
  { key: 'aiFeatures', label: 'AI Lineup Suggestions', icon: Brain },
  { key: 'advancedAnalytics', label: 'Advanced Analytics', icon: Sparkles },
  { key: 'prioritySupport', label: 'Priority Support', icon: Shield },
];

// Usage progress bar component
const UsageBar = ({ label, used, limit, icon: Icon }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
        <span className={`text-sm font-mono ${isAtLimit ? 'text-danger-red' : isNearLimit ? 'text-warning-orange' : 'text-text-muted'}`}>
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-void-elevated rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-danger-red' : isNearLimit ? 'bg-warning-orange' : 'bg-blade-blue'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-warning-orange flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit - consider upgrading
        </p>
      )}
      {isAtLimit && (
        <p className="text-xs text-danger-red flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached - upgrade to add more
        </p>
      )}
    </div>
  );
};

// Feature cell component
const FeatureCell = ({ value }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-blade-blue mx-auto" />
    ) : (
      <X className="w-5 h-5 text-text-muted/30 mx-auto" />
    );
  }
  if (value === -1) {
    return <span className="text-blade-blue font-medium">Unlimited</span>;
  }
  return <span className="text-text-secondary">{value}</span>;
};

function BillingPage() {
  const { activeTeamRole } = useAuthStore();
  const {
    subscription,
    plans: apiPlans,
    usage,
    loading,
    error,
    fetchSubscription,
    fetchPlans,
    createCheckout,
    openPortal,
    cancelSubscription,
    reactivateSubscription,
    clearError,
  } = useSubscriptionStore();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const isOwner = activeTeamRole === 'OWNER';
  const plans = apiPlans.length > 0 ? apiPlans : defaultPlans;
  const currentPlanId = subscription?.planId || 'free';
  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[0];

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  const handleUpgrade = async (priceId) => {
    if (!priceId) {
      window.open('mailto:sales@rowlab.app?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const result = await createCheckout(priceId);

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to create checkout:', result.error);
        // Error is displayed via store error state
      }
    } catch (err) {
      console.error('Failed to upgrade:', err);
      // Error is displayed via store error state
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await openPortal();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Failed to open portal:', result.error);
        // Error is displayed via store error state
      }
    } catch (err) {
      console.error('Failed to manage billing:', err);
      // Error is displayed via store error state
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    const result = await cancelSubscription(true);
    setCanceling(false);
    setCancelModalOpen(false);

    if (!result.success) {
      console.error('Failed to cancel subscription:', result.error);
    }
  };

  const handleReactivate = async () => {
    await reactivateSubscription();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Permission check
  if (!isOwner) {
    return (
      <div className="relative p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-warning-orange/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.08)"
            className={`
              rounded-xl p-8 text-center
              bg-void-elevated border border-warning-orange/20
            `}
          >
            <AlertTriangle className="w-12 h-12 text-warning-orange mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2">Access Restricted</h2>
            <p className="text-text-secondary">
              Only team owners can manage billing and subscription settings.
              Please contact your team owner to make changes.
            </p>
          </SpotlightCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Background atmosphere */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-coxswain-violet/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.15)]">
            <CreditCard className="w-5 h-5 text-coxswain-violet" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
            Billing & Subscription
          </h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary ml-[52px]">
          Manage your plan, usage, and payment settings
        </p>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-red" />
            <span className="text-danger-red">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-danger-red hover:text-danger-red/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Current Plan Card */}
        <motion.div variants={fadeInUp}>
          <SpotlightCard
            spotlightColor="rgba(124, 58, 237, 0.08)"
            className={`
              rounded-xl
              bg-void-elevated border border-white/5
            `}
          >
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <Crown className="w-5 h-5 text-coxswain-violet" />
              </div>
              <h3 className="text-lg font-display font-semibold text-text-primary">Current Plan</h3>
            </div>
            <div className="p-5">
              {loading && !subscription ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-coxswain-violet animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-coxswain-violet/20 border border-coxswain-violet/30 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)]">
                      <Crown className="w-8 h-8 text-coxswain-violet" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-2xl font-display font-bold text-text-primary">{currentPlan.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${planColors[currentPlanId] || planColors.free}`}>
                          {currentPlan.name}
                        </span>
                        {subscription?.status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[subscription.status] || statusColors.active}`}>
                            {subscription.status.replace('_', ' ').charAt(0).toUpperCase() + subscription.status.slice(1).replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {subscription?.cancelAtPeriodEnd && (
                        <p className="text-warning-orange text-sm flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Cancels on {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      )}
                      {subscription?.currentPeriodEnd && !subscription?.cancelAtPeriodEnd && currentPlanId !== 'free' && (
                        <p className="text-text-muted text-sm">
                          Next billing date: {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {subscription?.cancelAtPeriodEnd ? (
                      <button
                        onClick={handleReactivate}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blade-blue/10 text-blade-blue border border-blade-blue/20 hover:bg-blade-blue/20 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reactivate Subscription
                      </button>
                    ) : currentPlanId !== 'free' ? (
                      <button
                        onClick={handleManageBilling}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-void-elevated/50 text-text-secondary border border-white/[0.06] hover:bg-void-elevated hover:border-white/10 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Manage Billing
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Usage Stats */}
        <motion.div variants={fadeInUp}>
          <SpotlightCard
            className={`
              rounded-xl
              bg-void-elevated border border-white/5
            `}
          >
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.15)]">
                <BarChart3 className="w-5 h-5 text-blade-blue" />
              </div>
              <h3 className="text-lg font-display font-semibold text-text-primary">Usage</h3>
            </div>
            <div className="p-5">
              {loading && !usage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blade-blue animate-spin" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <UsageBar
                    label="Athletes"
                    used={usage?.athletes?.used || 0}
                    limit={usage?.athletes?.limit || currentPlan.features.athletes}
                    icon={Users}
                  />
                  <UsageBar
                    label="Coaches"
                    used={usage?.coaches?.used || 0}
                    limit={usage?.coaches?.limit || currentPlan.features.coaches}
                    icon={UserCog}
                  />
                </div>
              )}
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Plan Comparison Table */}
        <motion.div variants={fadeInUp}>
          <SpotlightCard
            spotlightColor="rgba(124, 58, 237, 0.08)"
            className={`
              rounded-xl
              bg-void-elevated border border-white/5
            `}
          >
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <Sparkles className="w-5 h-5 text-coxswain-violet" />
              </div>
              <h3 className="text-lg font-display font-semibold text-text-primary">Compare Plans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-text-muted font-medium text-sm">Features</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="p-4 text-center min-w-[140px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-text-primary font-semibold">{plan.name}</span>
                            {plan.popular && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-coxswain-violet/10 text-coxswain-violet border border-coxswain-violet/20">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">
                            {plan.price === null ? (
                              'Custom'
                            ) : plan.price === 0 ? (
                              'Free'
                            ) : (
                              <>
                                ${plan.price}
                                <span className="text-sm font-normal text-text-muted">/mo</span>
                              </>
                            )}
                          </div>
                          {currentPlanId === plan.id ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs bg-blade-blue/10 text-blade-blue border border-blade-blue/20">
                              Current Plan
                            </span>
                          ) : plan.price === null ? (
                            <button
                              onClick={() => handleUpgrade(null)}
                              className="inline-block px-4 py-1.5 rounded-lg text-sm bg-warning-orange/10 text-warning-orange border border-warning-orange/20 hover:bg-warning-orange/20 transition-colors"
                            >
                              Contact Sales
                            </button>
                          ) : plan.price === 0 ? null : (
                            <button
                              onClick={() => handleUpgrade(plan.priceId)}
                              disabled={checkoutLoading === plan.priceId || loading}
                              className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm bg-blade-blue text-void-deep border border-blade-blue hover:shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-all disabled:opacity-50"
                            >
                              {checkoutLoading === plan.priceId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : currentPlanId !== 'free' && plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlanId) ? (
                                'Downgrade'
                              ) : (
                                'Upgrade'
                              )}
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureDefinitions.map((feature) => (
                    <tr key={feature.key} className="border-b border-white/[0.04] hover:bg-void-elevated/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <feature.icon className="w-4 h-4 text-text-muted" />
                          <span className="text-text-secondary text-sm">{feature.label}</span>
                        </div>
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="p-4 text-center">
                          <FeatureCell value={plan.features[feature.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Cancel Subscription Section */}
        {currentPlanId !== 'free' && !subscription?.cancelAtPeriodEnd && (
          <motion.div variants={fadeInUp}>
            <SpotlightCard
              spotlightColor="rgba(239, 68, 68, 0.08)"
              className={`
                rounded-xl
                bg-void-surface/80 backdrop-blur-sm
                border border-danger-red/20
                [background-image:linear-gradient(rgba(12,12,14,0.9),rgba(12,12,14,0.9)),linear-gradient(to_bottom,rgba(239,68,68,0.1),rgba(239,68,68,0.02))]
                [background-origin:padding-box,border-box]
                [background-clip:padding-box,border-box]
              `}
            >
              <div className="flex items-center gap-3 p-5 border-b border-danger-red/10 bg-danger-red/5">
                <div className="w-10 h-10 rounded-xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <AlertTriangle className="w-5 h-5 text-danger-red" />
                </div>
                <h3 className="text-lg font-display font-semibold text-text-primary">Cancel Subscription</h3>
              </div>
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-text-secondary mb-1">
                      Cancel your subscription at the end of the billing period.
                    </p>
                    <p className="text-sm text-text-muted">
                      You will retain access to {currentPlan.name} features until {formatDate(subscription?.currentPeriodEnd)}.
                    </p>
                  </div>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-danger-red/30 text-danger-red hover:bg-danger-red/10 transition-colors whitespace-nowrap"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}
      </motion.div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-deep/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpotlightCard
              spotlightColor="rgba(239, 68, 68, 0.08)"
              className={`
                rounded-2xl p-6 max-w-md w-full
                bg-void-elevated border border-white/5
                shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
              `}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                  <AlertTriangle className="w-6 h-6 text-danger-red" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-text-primary">Cancel Subscription?</h3>
                  <p className="text-sm text-text-muted">This action can be undone</p>
                </div>
              </div>
              <div className="mb-6 space-y-3">
                <p className="text-text-secondary">
                  Your subscription will be canceled at the end of your current billing period.
                </p>
                <div className="p-3 rounded-xl bg-warning-orange/10 border border-warning-orange/20">
                  <p className="text-sm text-warning-orange font-medium">
                    You will lose access to:
                  </p>
                  <ul className="text-sm text-text-muted mt-2 space-y-1">
                    {currentPlan.features.aiFeatures && <li>- AI Lineup Suggestions</li>}
                    {currentPlan.features.advancedAnalytics && <li>- Advanced Analytics</li>}
                    {currentPlan.features.seatRacing && <li>- Seat Racing Features</li>}
                    <li>- Expanded athlete/coach limits</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-void-elevated/50 text-text-secondary border border-white/[0.06] hover:bg-void-elevated hover:border-white/10 transition-all"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger-red/10 text-danger-red border border-danger-red/20 hover:bg-danger-red/20 transition-colors"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default BillingPage;
