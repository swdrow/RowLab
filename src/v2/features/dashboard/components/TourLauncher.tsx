/**
 * TourLauncher Component
 * Phase 27-07: Button/menu item for launching guided tours
 *
 * Props:
 * - tourId: Unique identifier for the tour
 * - variant: 'button' | 'menu-item' (default: button)
 *
 * Features:
 * - Shows "New!" badge if tour hasn't been seen
 * - Button variant: small help button with Question mark icon
 * - Menu item variant: list item for dropdown menus
 */

import React from 'react';
import { Question } from '@phosphor-icons/react';
import { useTour } from '../hooks/useTour';

export interface TourLauncherProps {
  tourId: string;
  variant?: 'button' | 'menu-item';
  className?: string;
}

/**
 * TourLauncher - Renders a button or menu item to launch a guided tour
 */
export const TourLauncher: React.FC<TourLauncherProps> = ({
  tourId,
  variant = 'button',
  className = '',
}) => {
  const { startTour, hasSeenTour } = useTour(tourId, { autoStart: false });

  if (variant === 'menu-item') {
    return (
      <button
        onClick={startTour}
        className={`w-full text-left px-4 py-2 text-sm text-[var(--color-ink-bright)] hover:bg-[var(--color-ink-raised)] transition-colors flex items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Question className="w-4 h-4 text-[var(--color-ink-secondary)]" />
          <span>Show Dashboard Tour</span>
        </div>
        {!hasSeenTour && (
          <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-accent-copper)] text-white rounded">
            New!
          </span>
        )}
      </button>
    );
  }

  // Button variant
  return (
    <button
      onClick={startTour}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(255, 255, 255, 0.06)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-bright)] hover:bg-[var(--color-ink-raised)] hover:border-[rgba(255, 255, 255, 0.12)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-copper)] ${className}`}
      title="Show guided tour"
    >
      <Question className="w-5 h-5" />
      <span className="text-sm font-medium">Help</span>
      {!hasSeenTour && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-copper)] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-copper)]" />
        </span>
      )}
    </button>
  );
};
