import React from 'react';
import { Crown, ExternalLink, Loader2 } from 'lucide-react';

/**
 * PlanCard - Subscription plan display card
 *
 * Shows current subscription plan with:
 * - Plan name and status badge
 * - Next billing date
 * - Manage billing button (opens Stripe portal)
 */

interface PlanCardProps {
  /** Subscription plan ID (e.g., 'free', 'pro', 'team') */
  planId: string;
  /** Subscription status (e.g., 'active', 'past_due', 'canceled') */
  status: string;
  /** End of current billing period (ISO date string or null) */
  currentPeriodEnd: string | null;
  /** Callback to open Stripe billing portal */
  onManageBilling: () => void;
  /** Loading state for manage button */
  loading?: boolean;
}

/**
 * Capitalize first letter of plan ID
 */
function formatPlanName(planId: string): string {
  if (!planId) return 'Free';
  return planId.charAt(0).toUpperCase() + planId.slice(1);
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format date for display (e.g., "January 25, 2026")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get status badge color classes
 */
function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] border-[var(--color-status-success)]/20';
  }
  if (normalizedStatus === 'past_due' || normalizedStatus === 'past due') {
    return 'bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] border-[var(--color-status-error)]/20';
  }
  if (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled') {
    return 'bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/20';
  }
  if (normalizedStatus === 'trialing') {
    return 'bg-[var(--color-interactive-primary)]/10 text-[var(--color-interactive-primary)] border-[var(--color-interactive-primary)]/20';
  }

  // Default
  return 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]';
}

export const PlanCard: React.FC<PlanCardProps> = ({
  planId,
  status,
  currentPeriodEnd,
  onManageBilling,
  loading = false,
}) => {
  const isFree = planId?.toLowerCase() === 'free';
  const planName = formatPlanName(planId);
  const formattedStatus = formatStatus(status);
  const formattedDate = formatDate(currentPeriodEnd);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-surface)]/30 border border-[var(--color-border-subtle)]">
      {/* Plan info section */}
      <div className="flex items-center gap-4">
        {/* Crown icon with violet gradient */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-violet)]/20 border border-[var(--color-accent-violet)]/30 flex items-center justify-center shadow-[0_0_20px_var(--color-accent-violet-glow)]">
          <Crown className="w-8 h-8 text-[var(--color-accent-violet)]" />
        </div>

        {/* Plan details */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            {/* Plan name */}
            <h4 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {planName}
            </h4>

            {/* Status badge */}
            {status && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
              >
                {formattedStatus}
              </span>
            )}
          </div>

          {/* Next billing date (not shown for free plans) */}
          {!isFree && currentPeriodEnd && (
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Next billing: {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Manage button (hidden for free plans) */}
      {!isFree && (
        <button
          onClick={onManageBilling}
          disabled={loading}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-[var(--color-bg-surface)]/50 text-[var(--color-text-secondary)]
            border border-[var(--color-border-subtle)]
            hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-default)]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]
          `}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          Manage
        </button>
      )}
    </div>
  );
};

export default PlanCard;
