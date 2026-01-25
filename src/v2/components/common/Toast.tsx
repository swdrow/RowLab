import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { SPRING_CONFIG } from '../../utils/animations';

/**
 * Toast - Individual toast notification component
 *
 * Animated notification with icon, message, and dismiss button.
 * Uses Framer Motion with SPRING_CONFIG for entrance/exit animations.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'bg-[var(--color-status-success)]/10 border-[var(--color-status-success)]/20',
  error: 'bg-[var(--color-status-error)]/10 border-[var(--color-status-error)]/20',
  warning: 'bg-[var(--color-status-warning)]/10 border-[var(--color-status-warning)]/20',
  info: 'bg-[var(--color-status-info)]/10 border-[var(--color-status-info)]/20',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-[var(--color-status-success)]',
  error: 'text-[var(--color-status-error)]',
  warning: 'text-[var(--color-status-warning)]',
  info: 'text-[var(--color-status-info)]',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={SPRING_CONFIG}
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border
        ${colors[toast.type]}
        shadow-lg max-w-md backdrop-blur-sm
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.type]}`} />
      <p className="text-sm text-[var(--color-text-primary)] flex-1">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
      </button>
    </motion.div>
  );
};
