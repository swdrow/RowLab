import { getConfidenceLevel, type ConfidenceLevel } from '@v2/types/seatRacing';

export interface ConfidenceBadgeProps {
  confidence: number | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Visual badge component that displays confidence level for ELO ratings.
 *
 * Confidence tiers:
 * - UNRATED (0 or null): gray
 * - PROVISIONAL (0-0.2): red
 * - LOW (0.2-0.4): orange
 * - MEDIUM (0.4-0.7): yellow
 * - HIGH (0.7+): green
 */
export function ConfidenceBadge({
  confidence,
  size = 'sm',
  showLabel = true,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);

  const styles: Record<ConfidenceLevel, { bg: string; text: string; dot: string }> = {
    UNRATED: {
      bg: 'bg-[var(--ink-muted)]/10',
      text: 'text-[var(--ink-muted)]',
      dot: 'bg-[var(--ink-muted)]',
    },
    PROVISIONAL: {
      bg: 'bg-[var(--data-poor)]/10',
      text: 'text-[var(--data-poor)]',
      dot: 'bg-[var(--data-poor)]',
    },
    LOW: {
      bg: 'bg-[var(--data-warning)]/10',
      text: 'text-[var(--data-warning)]',
      dot: 'bg-[var(--data-warning)]',
    },
    MEDIUM: {
      bg: 'bg-[var(--data-warning)]/10',
      text: 'text-[var(--data-warning)]',
      dot: 'bg-[var(--data-warning)]',
    },
    HIGH: {
      bg: 'bg-[var(--data-excellent)]/10',
      text: 'text-[var(--data-excellent)]',
      dot: 'bg-[var(--data-excellent)]',
    },
  };

  const style = styles[level];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (!showLabel) {
    // Show only colored dot indicator
    return (
      <div
        className={`${style.dot} ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full`}
        title={level}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} ${style.bg} ${style.text} rounded-full font-medium`}
    >
      <span className={`${style.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full`} />
      {level}
    </span>
  );
}
