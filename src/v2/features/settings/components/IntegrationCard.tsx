import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Props for IntegrationCard
 */
export interface IntegrationCardProps {
  /** Icon to display in the card */
  icon: React.ReactNode;
  /** Tailwind background class for icon container */
  iconBg: string;
  /** Integration title */
  title: string;
  /** Description text (shown when disconnected) */
  description: string;
  /** Whether the integration is connected */
  connected: boolean;
  /** Username/account name when connected */
  username?: string;
  /** Last synced timestamp (ISO string or null) */
  lastSynced?: string | null;
  /** Handler for connect action */
  onConnect: () => void;
  /** Handler for disconnect action */
  onDisconnect: () => void;
  /** Optional handler for sync action (only shown if provided and connected) */
  onSync?: () => void;
  /** Whether sync is in progress */
  syncLoading?: boolean;
  /** Whether connect is in progress */
  connectLoading?: boolean;
  /** Whether disconnect is in progress */
  disconnectLoading?: boolean;
  /** Custom label for connect button (default: "Connect") */
  connectLabel?: string;
  /** Accent color for connected state (Tailwind color class, e.g., "text-interactive-primary") */
  accentColor?: string;
}

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

/**
 * IntegrationCard - Reusable card component for integration status display
 *
 * Features:
 * - 12x12 icon container with custom background
 * - Title and description/status area
 * - Connected state: green checkmark badge, username, last synced timestamp
 * - Disconnected state: description text
 * - Action buttons:
 *   - Connected: "Sync Now" (if onSync provided), "Disconnect" (danger style)
 *   - Disconnected: "Connect" button (primary style)
 *
 * Uses V2 design tokens from tailwind.config.js
 */
export function IntegrationCard({
  icon,
  iconBg,
  title,
  description,
  connected,
  username,
  lastSynced,
  onConnect,
  onDisconnect,
  onSync,
  syncLoading = false,
  connectLoading = false,
  disconnectLoading = false,
  connectLabel = 'Connect',
  accentColor = 'text-interactive-primary',
}: IntegrationCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle">
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>

        {/* Title and Status */}
        <div>
          <h4 className="font-medium text-txt-primary">{title}</h4>
          {connected ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${accentColor}`} />
                <span className={`text-sm ${accentColor}`}>
                  Connected{username ? ` as ${username}` : ''}
                </span>
              </div>
              {lastSynced && (
                <p className="text-xs text-txt-tertiary">
                  {formatLastSynced(lastSynced)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-txt-secondary mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {connected ? (
          <>
            {/* Sync Now Button (if handler provided) */}
            {onSync && (
              <button
                onClick={onSync}
                disabled={syncLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface-elevated/50 border border-bdr-default text-txt-secondary hover:bg-bg-hover hover:border-bdr-strong transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </button>
            )}

            {/* Disconnect Button */}
            <button
              onClick={onDisconnect}
              disabled={disconnectLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error hover:bg-status-error/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          </>
        ) : (
          /* Connect Button */
          <button
            onClick={onConnect}
            disabled={connectLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-interactive-primary text-txt-inverse border border-interactive-primary hover:bg-interactive-hover hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              connectLabel
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default IntegrationCard;
