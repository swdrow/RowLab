import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * UpgradePrompt - Modal component for prompting users to upgrade their plan
 *
 * Shows when users hit plan limits or try to access locked features.
 *
 * @param {Object} props
 * @param {'limit' | 'feature'} props.type - Type of prompt to display
 * @param {'athletes' | 'coaches'} [props.limitType] - Type of limit (for type='limit')
 * @param {number} [props.current] - Current usage count (for type='limit')
 * @param {number} [props.limit] - Maximum allowed (for type='limit')
 * @param {string} [props.feature] - Feature name (for type='feature')
 * @param {string} props.currentPlan - User's current plan name
 * @param {Function} props.onUpgrade - Callback when user clicks upgrade
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {boolean} props.isOpen - Controls modal visibility
 */
function UpgradePrompt({
  type,
  limitType,
  current,
  limit,
  feature,
  currentPlan,
  onUpgrade,
  onClose,
  isOpen,
}) {
  // Handle escape key
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  // Plan pricing info
  const planInfo = {
    free: { name: 'Free', price: '$0' },
    basic: { name: 'Basic', price: '$19/month' },
    pro: { name: 'Pro', price: '$49/month' },
    enterprise: { name: 'Enterprise', price: 'Contact us' },
  };

  const currentPlanInfo = planInfo[currentPlan?.toLowerCase()] || planInfo.free;

  // Determine recommended upgrade based on current plan
  const getRecommendedPlan = () => {
    const planOrder = ['free', 'basic', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan?.toLowerCase() || 'free');
    const nextPlan = planOrder[Math.min(currentIndex + 1, planOrder.length - 1)];
    return planInfo[nextPlan] || planInfo.pro;
  };

  const recommendedPlan = getRecommendedPlan();

  // Feature benefits for locked features
  const featureBenefits = [
    'Unlimited athletes and coaches',
    'Advanced analytics and reporting',
    'Priority email support',
    'Custom integrations',
    'Team collaboration tools',
  ];

  // Calculate usage percentage for progress bar
  const usagePercentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-surface-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-border-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-accent via-indigo-500 to-purple-600 px-6 py-8 text-white">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            {type === 'limit' ? (
              <div className="p-3 bg-white/20 rounded-full">
                <AlertTriangleIcon className="w-8 h-8" />
              </div>
            ) : (
              <div className="p-3 bg-white/20 rounded-full">
                <LockIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center">
            {type === 'limit'
              ? `You've reached your ${limitType || 'usage'} limit`
              : `Unlock ${feature || 'this feature'}`}
          </h2>

          {/* Subtitle */}
          <p className="mt-2 text-center text-white/80">
            {type === 'limit'
              ? `Your ${currentPlanInfo?.name || 'current'} plan allows ${limit || 0} ${limitType || 'items'}. Upgrade to add more.`
              : 'This feature is available on Pro and Enterprise plans.'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {type === 'limit' ? (
            <>
              {/* Usage Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">Current usage</span>
                  <span className="text-text-primary font-medium">
                    {current} / {limit} {limitType}
                  </span>
                </div>
                <div className="h-3 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-200"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                {usagePercentage >= 100 && (
                  <p className="mt-2 text-xs text-spectrum-red">
                    Limit reached - upgrade to continue adding {limitType}
                  </p>
                )}
              </div>

              {/* Plan Comparison */}
              <div className="space-y-3">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg border border-border-subtle">
                  <div>
                    <span className="text-xs text-text-muted uppercase tracking-wide">Current</span>
                    <p className="font-medium text-text-primary">{currentPlanInfo.name}</p>
                  </div>
                  <span className="text-text-secondary">{currentPlanInfo.price}</span>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDownIcon className="w-5 h-5 text-text-muted" />
                </div>

                {/* Recommended Plan */}
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/30">
                  <div>
                    <span className="text-xs text-accent uppercase tracking-wide">Recommended</span>
                    <p className="font-medium text-text-primary">{recommendedPlan.name}</p>
                  </div>
                  <span className="text-accent font-semibold">{recommendedPlan.price}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Feature Benefits */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  Unlock these benefits with Pro:
                </h3>
                <ul className="space-y-2">
                  {featureBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckIcon className="w-4 h-4 text-success flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan Info */}
              <div className="p-4 bg-accent/10 rounded-xl border border-accent/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Upgrade to</p>
                    <p className="text-lg font-semibold text-text-primary">{recommendedPlan.name}</p>
                  </div>
                  <p className="text-xl font-bold text-accent">{recommendedPlan.price}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-3 px-4 bg-gradient-to-r from-accent to-indigo-500 hover:from-accent/90 hover:to-indigo-500/90 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-indigo/30 hover:shadow-glow-indigo/50 active:scale-[0.98]"
          >
            Upgrade Now
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Icon Components
function AlertTriangleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowDownIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

export default UpgradePrompt;
