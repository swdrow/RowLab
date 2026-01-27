import React, { useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { SPRING_CONFIG, usePrefersReducedMotion } from '@v2/utils/animations';

/**
 * Simple className utility for conditional classes
 */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Action button configuration for swipe-to-reveal actions
 */
export interface MobileCardAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action button */
  label: string;
  /** Icon to display (React node - use Lucide icons) */
  icon: React.ReactNode;
  /** Action button color variant */
  color: 'danger' | 'warning' | 'success' | 'primary';
  /** Handler called when action is triggered */
  onClick: () => void;
}

/**
 * MobileCard component props
 */
export interface MobileCardProps {
  /** Card content */
  children: React.ReactNode;
  /** Actions revealed when swiping right (appear on left) */
  leftActions?: MobileCardAction[];
  /** Actions revealed when swiping left (appear on right) */
  rightActions?: MobileCardAction[];
  /** Handler called when card is tapped (not swiped) */
  onTap?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Color mappings for action buttons using warm palette tokens
 */
const actionColors = {
  danger: 'bg-[var(--color-status-error)]',
  warning: 'bg-[var(--color-status-warning)]',
  success: 'bg-[var(--color-status-success)]',
  primary: 'bg-[var(--color-interactive-primary)]',
};

/**
 * MobileCard Component
 *
 * A swipeable card component for mobile interfaces that reveals action buttons
 * when swiped left or right. Designed to replace tables on mobile with a more
 * touch-friendly card-based layout.
 *
 * Features:
 * - Swipe left to reveal right actions (e.g., delete, archive)
 * - Swipe right to reveal left actions (e.g., complete, favorite)
 * - Spring physics for natural feel
 * - Respects reduced motion preferences
 * - 44px minimum touch targets on action buttons
 *
 * @example
 * ```tsx
 * <MobileCard
 *   leftActions={[
 *     { id: 'complete', label: 'Done', icon: <Check />, color: 'success', onClick: handleComplete }
 *   ]}
 *   rightActions={[
 *     { id: 'delete', label: 'Delete', icon: <Trash />, color: 'danger', onClick: handleDelete }
 *   ]}
 *   onTap={() => navigate(`/item/${id}`)}
 * >
 *   <MobileCardField label="Name" value="John Doe" />
 *   <MobileCardField label="2k Time" value="6:32.5" mono />
 * </MobileCard>
 * ```
 */
export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onTap,
  className,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const actionWidth = 80; // Width per action button
  const leftActionsWidth = leftActions.length * actionWidth;
  const rightActionsWidth = rightActions.length * actionWidth;

  /**
   * Handle drag end - snap to reveal actions or return to center
   */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);

    const threshold = actionWidth / 2;
    const { offset, velocity } = info;

    // Swipe right to reveal left actions
    if (offset.x > threshold || velocity.x > 500) {
      if (leftActions.length > 0) {
        controls.start({ x: leftActionsWidth });
        return;
      }
    }

    // Swipe left to reveal right actions
    if (offset.x < -threshold || velocity.x < -500) {
      if (rightActions.length > 0) {
        controls.start({ x: -rightActionsWidth });
        return;
      }
    }

    // Snap back to center
    controls.start({ x: 0 });
  };

  /**
   * Handle tap - only trigger if not dragging
   */
  const handleTap = () => {
    if (!isDragging && onTap) {
      onTap();
    }
  };

  /**
   * Render action buttons for a given side
   */
  const renderActions = (actions: MobileCardAction[], side: 'left' | 'right') => (
    <div
      className={cn(
        'absolute top-0 bottom-0 flex',
        side === 'left' ? 'left-0' : 'right-0',
        side === 'left' ? 'flex-row' : 'flex-row-reverse'
      )}
      style={{ width: actions.length * actionWidth }}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            // Reset card position after action
            controls.start({ x: 0 });
          }}
          className={cn(
            'flex flex-col items-center justify-center',
            'w-20 h-full min-h-[44px]',
            'text-white text-xs font-medium',
            'transition-opacity hover:opacity-90',
            actionColors[action.color]
          )}
          aria-label={action.label}
        >
          <span className="mb-1">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );

  // Non-animated fallback for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl p-4',
          onTap && 'cursor-pointer active:bg-[var(--color-bg-hover)]',
          className
        )}
        onClick={onTap}
        role={onTap ? 'button' : undefined}
        tabIndex={onTap ? 0 : undefined}
        onKeyDown={
          onTap
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTap();
                }
              }
            : undefined
        }
      >
        {children}
        {/* Show action buttons as visible buttons for accessibility */}
        {(leftActions.length > 0 || rightActions.length > 0) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
            {leftActions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white min-h-[44px]',
                  actionColors[action.color]
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {rightActions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white min-h-[44px]',
                  actionColors[action.color]
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background actions - revealed on swipe */}
      {leftActions.length > 0 && renderActions(leftActions, 'left')}
      {rightActions.length > 0 && renderActions(rightActions, 'right')}

      {/* Foreground card - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionsWidth : 0,
          right: leftActions.length > 0 ? leftActionsWidth : 0,
        }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        transition={SPRING_CONFIG}
        onTap={handleTap}
        className={cn(
          'relative bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl p-4',
          'cursor-grab active:cursor-grabbing',
          'touch-pan-y', // Allow vertical scrolling
          className
        )}
        role={onTap ? 'button' : undefined}
        tabIndex={onTap ? 0 : undefined}
        onKeyDown={
          onTap
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTap();
                }
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </div>
  );
};

/**
 * MobileCardField Component
 *
 * A key-value display component for use within MobileCard.
 * Displays a label on the left and value on the right.
 *
 * @example
 * ```tsx
 * <MobileCardField label="Name" value="John Doe" />
 * <MobileCardField label="2k Time" value="6:32.5" mono />
 * ```
 */
export interface MobileCardFieldProps {
  /** Field label (displayed on left) */
  label: string;
  /** Field value (displayed on right) */
  value: React.ReactNode;
  /** Use monospace font for numeric values */
  mono?: boolean;
}

export const MobileCardField: React.FC<MobileCardFieldProps> = ({
  label,
  value,
  mono,
}) => (
  <div className="flex justify-between items-center py-1.5">
    <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
      {label}
    </span>
    <span
      className={cn(
        'text-sm text-[var(--color-text-primary)]',
        mono && 'font-mono tabular-nums'
      )}
    >
      {value}
    </span>
  </div>
);

/**
 * MobileCardHeader Component
 *
 * A header section for MobileCard with title and optional badge/status.
 *
 * @example
 * ```tsx
 * <MobileCardHeader
 *   title="John Doe"
 *   subtitle="Port"
 *   badge={<StatusBadge status="active" />}
 * />
 * ```
 */
export interface MobileCardHeaderProps {
  /** Primary title */
  title: string;
  /** Secondary subtitle */
  subtitle?: string;
  /** Optional badge or status indicator */
  badge?: React.ReactNode;
  /** Optional avatar or icon on the left */
  avatar?: React.ReactNode;
}

export const MobileCardHeader: React.FC<MobileCardHeaderProps> = ({
  title,
  subtitle,
  badge,
  avatar,
}) => (
  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--color-border-subtle)]">
    {avatar && <div className="flex-shrink-0">{avatar}</div>}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {title}
        </h3>
        {badge}
      </div>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

MobileCard.displayName = 'MobileCard';
MobileCardField.displayName = 'MobileCardField';
MobileCardHeader.displayName = 'MobileCardHeader';

export default MobileCard;
