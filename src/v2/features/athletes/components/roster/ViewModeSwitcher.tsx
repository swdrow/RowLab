import { motion } from 'framer-motion';
import { LayoutGrid, List, AlignJustify } from 'lucide-react';
import { SPRING_FAST } from '@v2/utils/animations';

export type ViewMode = 'grid' | 'table' | 'compact';

export interface ViewModeSwitcherProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

const VIEW_OPTIONS: Array<{ mode: ViewMode; icon: typeof LayoutGrid; label: string }> = [
  { mode: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { mode: 'table', icon: List, label: 'Table view' },
  { mode: 'compact', icon: AlignJustify, label: 'Compact view' },
];

/**
 * Three-mode segmented control for switching between grid, table, and compact views.
 * Uses Framer Motion layoutId for smooth active indicator animation.
 */
export function ViewModeSwitcher({ view, onChange, className = '' }: ViewModeSwitcherProps) {
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-ink-border bg-bg-surface p-0.5 ${className}`}
      role="radiogroup"
      aria-label="View mode"
    >
      {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => {
        const isActive = view === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`relative flex items-center justify-center rounded-md px-2.5 py-1.5 transition-colors ${
              isActive ? 'text-accent-copper' : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
          >
            {isActive && (
              <motion.div
                layoutId="view-mode-indicator"
                className="absolute inset-0 rounded-md bg-accent-copper/[0.12] border border-accent-copper/30"
                transition={SPRING_FAST}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export default ViewModeSwitcher;
