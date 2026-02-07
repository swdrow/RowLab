/**
 * PRBadge Component
 * Phase 27-04: Inline gold badge indicator for personal records
 *
 * Per CONTEXT.md: "PRs and achievements integrated inline with stats — gold badge
 * next to a metric if it's a PR, subtle but always present."
 */

import { motion } from 'framer-motion';
import { Trophy } from '@phosphor-icons/react';
import { SPRING_FAST } from '../../../../utils/animations';

interface PRBadgeProps {
  isPR: boolean;
  className?: string;
  tooltip?: string;
}

/**
 * Inline gold badge for personal records
 * - Returns null if not a PR
 * - Gold trophy icon with spring entrance animation
 * - 14x14px, inline with metric text
 */
export function PRBadge({ isPR, className = '', tooltip = 'Personal Record' }: PRBadgeProps) {
  if (!isPR) return null;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRING_FAST}
      className={`inline-flex items-center justify-center ${className}`}
      title={tooltip}
      aria-label={tooltip}
    >
      <Trophy className="w-3.5 h-3.5 text-amber-400" weight="fill" />
    </motion.div>
  );
}
