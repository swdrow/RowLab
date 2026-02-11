/**
 * Exception Banner & Badge Components
 * Phase 27-03: Dual-layer exception display (banner + widget badges)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, CaretUp, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { SPRING_GENTLE } from '../../../utils/animations';
import { getExceptionColor } from '../hooks/useExceptions';
import type { ExceptionSummary, ExceptionSeverity, ExceptionItem } from '../types';

interface ExceptionBannerProps {
  summary: ExceptionSummary;
}

/**
 * ExceptionBanner - Top alert banner showing critical/warning counts
 *
 * Auto-hides when no issues. Expands to show individual exception items.
 * Per CONTEXT.md: "Top alert banner strip showing critical count + individual widget badges for detail"
 */
export const ExceptionBanner: React.FC<ExceptionBannerProps> = ({ summary }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Auto-hide when no exceptions
  if (summary.critical === 0 && summary.warning === 0) {
    return null;
  }

  // Determine severity (critical takes precedence)
  const hasCritical = summary.critical > 0;
  const severity: ExceptionSeverity = hasCritical ? 'critical' : 'warning';
  const colors = getExceptionColor(severity);

  // Filter items by severity for display
  const criticalItems = summary.items.filter((item) => item.severity === 'critical');
  const warningItems = summary.items.filter((item) => item.severity === 'warning');

  const handleActionClick = (item: ExceptionItem) => {
    if (item.actionPath) {
      navigate(item.actionPath);
    }
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={SPRING_GENTLE}
      className="mb-4"
    >
      <div
        className={`glass-card border-l-4 ${
          hasCritical ? 'border-l-status-error' : 'border-l-status-warning'
        } ${hasCritical ? 'bg-status-error/5' : 'bg-status-warning/5'}`}
      >
        {/* Collapsed header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Critical count */}
            {summary.critical > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-status-error text-white text-xs font-semibold">
                  {summary.critical}
                </div>
                <span className="text-sm font-medium text-status-error">
                  Critical {summary.critical === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>
            )}

            {/* Warning count */}
            {summary.warning > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-status-warning text-white text-xs font-semibold">
                  {summary.warning}
                </div>
                <span className="text-sm font-medium text-status-warning">
                  {summary.warning === 1 ? 'Warning' : 'Warnings'}
                </span>
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-bright)] hover:bg-[var(--color-ink-raised)] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-copper)]"
          >
            {isExpanded ? 'Hide details' : 'View details'}
            {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SPRING_GENTLE}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-[rgba(255, 255, 255, 0.06)]">
                {/* Critical items */}
                {criticalItems.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-status-error uppercase tracking-wide mb-2">
                      Critical Issues
                    </h4>
                    <div className="space-y-2">
                      {criticalItems.map((item) => (
                        <ExceptionItemRow key={item.id} item={item} onClick={handleActionClick} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning items */}
                {warningItems.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-status-warning uppercase tracking-wide mb-2">
                      Warnings
                    </h4>
                    <div className="space-y-2">
                      {warningItems.map((item) => (
                        <ExceptionItemRow key={item.id} item={item} onClick={handleActionClick} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * Individual exception item row
 */
interface ExceptionItemRowProps {
  item: ExceptionItem;
  onClick: (item: ExceptionItem) => void;
}

const ExceptionItemRow: React.FC<ExceptionItemRowProps> = ({ item, onClick }) => {
  const colors = getExceptionColor(item.severity);

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--color-ink-raised)] transition-colors">
      {/* Severity dot */}
      <div className={`w-2 h-2 rounded-full ${colors.bg} mt-1.5 flex-shrink-0`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-ink-bright)]">{item.title}</p>
        <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">{item.description}</p>
      </div>

      {/* Action button */}
      {item.actionLabel && item.actionPath && (
        <button
          onClick={() => onClick(item)}
          className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent-copper)] hover:text-[var(--color-interactive-hover)] flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-copper)] rounded px-2 py-1"
        >
          {item.actionLabel}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// ============================================
// EXCEPTION BADGE (for widget overlays)
// ============================================

interface ExceptionBadgeProps {
  severity: ExceptionSeverity;
  count: number;
  className?: string;
}

/**
 * ExceptionBadge - Small badge overlay for widget corners
 *
 * Displays red/amber circle with count. Auto-hides when severity is 'ok' or count is 0.
 * Per CONTEXT.md: "Individual widget badges for detail"
 */
export const ExceptionBadge: React.FC<ExceptionBadgeProps> = ({
  severity,
  count,
  className = '',
}) => {
  // Hide if no exceptions or severity is ok
  if (severity === 'ok' || count === 0) {
    return null;
  }

  const isCritical = severity === 'critical';

  return (
    <div
      className={`absolute top-2 right-2 z-10 flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-semibold ${
        isCritical ? 'bg-status-error exception-badge-pulse' : 'bg-status-warning'
      } ${className}`}
    >
      {count}
    </div>
  );
};

// CSS animation for critical badge pulse
// Add to global styles or inject via styled component
const styles = `
@keyframes exception-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.exception-badge-pulse {
  animation: exception-pulse 2s ease-in-out infinite;
}
`;

// Inject styles on mount
if (typeof document !== 'undefined' && !document.getElementById('exception-badge-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'exception-badge-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
