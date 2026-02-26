/**
 * IntegrationCard -- reusable card for integration status display.
 *
 * Ported from v2 IntegrationCard with v4 Canvas design tokens:
 * - Surface: bg-void-surface, border-edge-default
 * - Text: text-text-bright, text-text-dim, text-text-faint
 * - Primary button: bg-accent-teal, text-void-deep
 * - Error/disconnect: data-poor tokens
 * - Loading states: skeleton shimmer (no animate-spin)
 */
import { IconCheckCircle } from '@/components/icons';
import type { IntegrationCardProps } from './types';

/**
 * Format a date string as "Jan 25, 2026 at 10:30 AM"
 */
function formatLastSynced(dateString: string): string {
  const date = new Date(dateString);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `Last synced: ${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
}

/** Inline skeleton shimmer for button loading states */
function ButtonSkeleton({ width = 'w-16' }: { width?: string }) {
  return (
    <div className="flex items-center gap-2 animate-shimmer">
      <div className="h-4 w-4 rounded bg-edge-default/50" />
      <div className={`h-3 ${width} rounded bg-edge-default/30`} />
    </div>
  );
}

export function IntegrationCard({
  icon,
  iconBg,
  title,
  description,
  connected,
  username,
  lastSynced,
  statsLine,
  onConnect,
  onDisconnect,
  onSync,
  syncLoading = false,
  connectLoading = false,
  disconnectLoading = false,
  connectLabel = 'Connect',
  accentColor = 'text-accent-teal',
}: IntegrationCardProps) {
  return (
    <div className="panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Icon Container */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>

        {/* Title and Status */}
        <div className="min-w-0">
          <h4 className="font-display font-medium text-text-bright">{title}</h4>
          {connected ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <IconCheckCircle className={`w-4 h-4 ${accentColor} shrink-0`} />
                <span className={`text-sm ${accentColor} truncate`}>
                  Connected{username ? ` as ${username}` : ''}
                </span>
              </div>
              {lastSynced && (
                <p className="text-xs text-text-faint truncate">{formatLastSynced(lastSynced)}</p>
              )}
              {statsLine && <p className="text-xs text-text-dim">{statsLine}</p>}
            </div>
          ) : (
            <p className="text-sm text-text-dim mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
        {connected ? (
          <>
            {/* Sync Now Button */}
            {onSync && (
              <button
                onClick={onSync}
                disabled={syncLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-deep border border-edge-default text-text-dim hover:bg-void-raised hover:border-edge-default transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncLoading ? <ButtonSkeleton width="w-12" /> : 'Sync Now'}
              </button>
            )}

            {/* Disconnect Button */}
            <button
              onClick={onDisconnect}
              disabled={disconnectLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-data-poor/10 border border-data-poor/20 text-data-poor hover:bg-data-poor/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnectLoading ? <ButtonSkeleton width="w-20" /> : 'Disconnect'}
            </button>
          </>
        ) : (
          /* Connect Button */
          <button
            onClick={onConnect}
            disabled={connectLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-teal text-void-deep font-medium hover:bg-accent-teal-hover hover:shadow-focus transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectLoading ? <ButtonSkeleton width="w-16" /> : connectLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default IntegrationCard;
