import { useState, useEffect } from 'react';
import {
  useTriggerC2Sync,
  useConcept2Status,
  useMyC2Sync,
  useMyC2Status,
} from '@v2/hooks/useConcept2';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';

export interface C2SyncButtonProps {
  /** Sync mode: athlete-specific or user-level */
  mode?: 'athlete' | 'user';
  /** Athlete ID to sync C2 workouts for (required for mode="athlete") */
  athleteId?: string;
  /** Button variant: full button with text or icon-only */
  variant?: 'button' | 'icon';
  /** Button size */
  size?: 'sm' | 'md';
  /** Optional callback when sync completes successfully */
  onSyncComplete?: (result: any) => void;
}

/**
 * Button to trigger manual Concept2 sync
 *
 * Modes:
 * - athlete: Sync for specific athlete (requires athleteId)
 * - user: Sync for current user's own workouts
 *
 * States:
 * - Ready - shows "Sync" or refresh icon
 * - Syncing - shows spinner
 * - Success - shows checkmark briefly
 * - Error - shows error icon briefly
 *
 * Disabled if not connected to Concept2
 */
export function C2SyncButton({
  mode = 'athlete',
  athleteId,
  variant = 'button',
  size = 'md',
  onSyncComplete,
}: C2SyncButtonProps) {
  // Use different hooks based on mode
  const athleteStatus = useConcept2Status(mode === 'athlete' ? athleteId : undefined);
  const athleteSync = useTriggerC2Sync(mode === 'athlete' ? athleteId : undefined);
  const userStatus = useMyC2Status();
  const userSync = useMyC2Sync();

  // Select the appropriate values based on mode
  const isConnected = mode === 'user' ? userStatus.isConnected : athleteStatus.isConnected;
  const isStatusLoading = mode === 'user' ? userStatus.isLoading : athleteStatus.isLoading;
  const triggerSync = mode === 'user' ? userSync.triggerSync : athleteSync.triggerSync;
  const isSyncing = mode === 'user' ? userSync.isSyncing : athleteSync.isSyncing;
  const syncError = mode === 'user' ? userSync.syncError : athleteSync.syncError;
  const syncResult = mode === 'user' ? userSync.syncResult : athleteSync.syncResult;
  const lastSyncedAt = mode === 'user' ? userStatus.lastSyncedAt : undefined;
  const username = mode === 'user' ? userStatus.username : undefined;

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Handle sync success
  useEffect(() => {
    if (syncResult && !isSyncing) {
      setShowSuccess(true);
      onSyncComplete?.(syncResult);

      // Reset success state after 2 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [syncResult, isSyncing, onSyncComplete]);

  // Handle sync error
  useEffect(() => {
    if (syncError && !isSyncing) {
      setShowError(true);

      // Reset error state after 3 seconds
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [syncError, isSyncing]);

  const handleClick = () => {
    if (isConnected && !isSyncing) {
      triggerSync();
    }
  };

  const isDisabled = !isConnected || isSyncing || isStatusLoading;

  // Build tooltip text
  const getTooltipText = () => {
    if (!isConnected) {
      return 'Concept2 not connected';
    }
    if (showError && syncError) {
      return `Sync failed: ${(syncError as any)?.message || 'Unknown error'}`;
    }
    if (showSuccess) {
      return 'Sync complete';
    }
    if (mode === 'user' && (username || lastSyncedAt)) {
      const parts: string[] = ['Sync Concept2 workouts'];
      if (username) parts.push(`Connected as: ${username}`);
      if (lastSyncedAt) {
        const lastSyncDate = new Date(lastSyncedAt);
        parts.push(
          `Last synced: ${lastSyncDate.toLocaleDateString()} ${lastSyncDate.toLocaleTimeString()}`
        );
      }
      return parts.join('\n');
    }
    return 'Sync Concept2 workouts';
  };

  // Determine button content based on state
  const getButtonContent = () => {
    if (showError) {
      return {
        icon: <AlertTriangle size={size === 'sm' ? 14 : 16} />,
        text: 'Error',
        className: 'bg-status-error/10 text-status-error hover:bg-status-error/20',
      };
    }

    if (showSuccess) {
      return {
        icon: <Check size={size === 'sm' ? 14 : 16} />,
        text: 'Synced',
        className: 'bg-data-excellent/10 text-data-excellent',
      };
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw size={size === 'sm' ? 14 : 16} className="animate-spin" />,
        text: 'Syncing...',
        className: 'bg-interactive-primary text-white',
      };
    }

    return {
      icon: <RefreshCw size={size === 'sm' ? 14 : 16} />,
      text: 'Sync',
      className: isDisabled
        ? 'bg-bg-subtle text-txt-disabled cursor-not-allowed'
        : 'bg-interactive-primary text-white hover:bg-interactive-primary-hover',
    };
  };

  const { icon, text, className } = getButtonContent();

  const baseClasses =
    'inline-flex items-center justify-center rounded-md transition-colors font-medium';
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';

  const tooltipText = getTooltipText();

  // Icon-only variant
  if (variant === 'icon') {
    const iconSizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses} ${iconSizeClasses} ${className}`}
        title={tooltipText}
      >
        {icon}
      </button>
    );
  }

  // Full button variant
  const buttonSizeClasses = size === 'sm' ? 'px-2.5 py-1.5 gap-1.5' : 'px-3 py-2 gap-2';
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses} ${buttonSizeClasses} ${className}`}
      title={tooltipText}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
