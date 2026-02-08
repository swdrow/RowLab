import { useConcept2Status } from '@v2/hooks/useConcept2';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface C2StatusBadgeProps {
  /** Athlete ID to show C2 status for */
  athleteId: string;
  /** Show full text or compact version */
  variant?: 'full' | 'compact';
  /** How many minutes before a sync is considered stale */
  staleThresholdMinutes?: number;
}

/**
 * Badge showing Concept2 connection status for an athlete
 *
 * States:
 * - Connected + recent sync (green) - last sync within threshold
 * - Connected + stale sync (yellow) - last sync beyond threshold
 * - Not connected (gray)
 * - Loading (spinner)
 */
export function C2StatusBadge({
  athleteId,
  variant = 'full',
  staleThresholdMinutes = 60,
}: C2StatusBadgeProps) {
  const { status, isConnected, isLoading } = useConcept2Status(athleteId);

  // Calculate relative time for last sync
  const getRelativeTime = (timestamp: string | null | undefined): string => {
    if (!timestamp) return 'Never';

    const now = new Date();
    const syncDate = new Date(timestamp);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  };

  // Check if sync is stale (beyond threshold)
  const isSyncStale = (): boolean => {
    if (!isConnected || !status.lastSyncedAt) return false;

    const now = new Date();
    const syncDate = new Date(status.lastSyncedAt);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    return diffMinutes > staleThresholdMinutes;
  };

  const relativeTime = getRelativeTime(status.lastSyncedAt);
  const isStale = isSyncStale();

  // Loading state
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-subtle text-txt-tertiary text-xs">
        <Loader2 size={14} className="animate-spin" />
        {variant === 'full' && <span>Loading...</span>}
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-subtle text-txt-tertiary text-xs"
        title="Concept2 not connected"
      >
        <XCircle size={14} />
        {variant === 'full' && <span>Not Connected</span>}
      </div>
    );
  }

  // Connected + stale state (yellow)
  if (isStale) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-data-warning/10 text-data-warning text-xs"
        title={`Last synced: ${relativeTime}`}
      >
        <AlertCircle size={14} />
        {variant === 'full' && (
          <span>
            Connected <span className="text-txt-tertiary">· {relativeTime}</span>
          </span>
        )}
      </div>
    );
  }

  // Connected + recent state (green)
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-data-excellent/10 text-data-excellent text-xs"
      title={`Last synced: ${relativeTime}`}
    >
      <CheckCircle2 size={14} />
      {variant === 'full' && (
        <span>
          Connected <span className="text-txt-tertiary">· {relativeTime}</span>
        </span>
      )}
    </div>
  );
}
