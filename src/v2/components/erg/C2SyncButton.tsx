import { useState, useEffect } from 'react';
import { useTriggerC2Sync, useConcept2Status } from '@v2/hooks/useConcept2';
import { RefreshCw, Check, AlertTriangle } from 'lucide-react';

export interface C2SyncButtonProps {
  /** Athlete ID to sync C2 workouts for */
  athleteId: string;
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
 * States:
 * - Ready - shows "Sync" or refresh icon
 * - Syncing - shows spinner
 * - Success - shows checkmark briefly
 * - Error - shows error icon briefly
 *
 * Disabled if athlete not connected to Concept2
 */
export function C2SyncButton({
  athleteId,
  variant = 'button',
  size = 'md',
  onSyncComplete,
}: C2SyncButtonProps) {
  const { isConnected, isLoading: isStatusLoading } = useConcept2Status(athleteId);
  const { triggerSync, isSyncing, syncError, syncResult } = useTriggerC2Sync(athleteId);

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

  // Icon-only variant
  if (variant === 'icon') {
    const iconSizeClasses = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${baseClasses} ${sizeClasses} ${iconSizeClasses} ${className}`}
        title={
          !isConnected
            ? 'Concept2 not connected'
            : showError
              ? `Sync failed: ${syncError?.message || 'Unknown error'}`
              : showSuccess
                ? 'Sync complete'
                : 'Sync Concept2 workouts'
        }
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
      title={
        !isConnected
          ? 'Concept2 not connected'
          : showError
            ? `Sync failed: ${syncError?.message || 'Unknown error'}`
            : undefined
      }
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}
