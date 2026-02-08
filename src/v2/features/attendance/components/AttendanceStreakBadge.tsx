import { Flame } from 'lucide-react';

// ============================================
// Types
// ============================================

type StreakStatus = 'active' | 'at-risk' | 'broken';

interface AttendanceStreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
  status?: StreakStatus;
}

// ============================================
// Status Colors (Phase 16-11 streak color decision)
// ============================================

const STATUS_STYLES: Record<StreakStatus, string> = {
  active: 'text-data-excellent bg-data-excellent/10',
  'at-risk': 'text-data-warning bg-data-warning/10',
  broken: 'text-txt-tertiary bg-bg-surface-elevated',
};

const SIZE_STYLES: Record<'sm' | 'md', { text: string; icon: number }> = {
  sm: { text: 'text-xs', icon: 12 },
  md: { text: 'text-sm', icon: 14 },
};

// ============================================
// Helpers
// ============================================

/**
 * Derive streak status from count if not explicitly provided.
 * - active: >= 5 consecutive days
 * - at-risk: 1-4 consecutive days
 * - broken: 0 days
 */
function deriveStatus(streak: number): StreakStatus {
  if (streak >= 5) return 'active';
  if (streak >= 1) return 'at-risk';
  return 'broken';
}

// ============================================
// Component
// ============================================

/**
 * Attendance streak counter badge per athlete.
 *
 * Displays a flame icon with the consecutive attendance day count.
 * Color-coded by streak health status (Phase 16-11 decision):
 *   active (>= 5): green
 *   at-risk (1-4): amber
 *   broken (0): gray
 */
export function AttendanceStreakBadge({ streak, size = 'sm', status }: AttendanceStreakBadgeProps) {
  const resolvedStatus = status ?? deriveStatus(streak);
  const sizeConfig = SIZE_STYLES[size];
  const statusClasses = STATUS_STYLES[resolvedStatus];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
        ${sizeConfig.text} ${statusClasses}
      `}
      title={streak === 0 ? 'No streak' : `${streak} day streak`}
    >
      <Flame size={sizeConfig.icon} />
      <span className="font-mono">{streak}</span>
      <span>{streak === 0 ? 'No streak' : streak === 1 ? 'day' : 'days'}</span>
    </span>
  );
}

export default AttendanceStreakBadge;
