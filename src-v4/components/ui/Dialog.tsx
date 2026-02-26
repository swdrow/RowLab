/**
 * Dialog component — oarbit design system.
 *
 * bg-void-overlay, border-edge-default, shadow-lg.
 * radius-xl (12px). Padding space-6 (24px).
 * Backdrop: oklch(0 0 0 / 0.6) — opaque, no blur.
 * Uses native <dialog> for focus trap, Escape key, backdrop click.
 * Spring animation (flow) for entrance/exit.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from '@/components/icons';
import { motion as motionTokens } from '@/design-system';

const SPRING_FLOW = {
  type: 'spring' as const,
  ...motionTokens.spring.flow,
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Tailwind max-width class. Default: max-w-lg (640px) */
  maxWidth?: string;
  showClose?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Handle native close event (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!isInDialog) {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- <dialog> handles Escape natively; onClick is for backdrop dismiss
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`
        backdrop:bg-black/60
        bg-transparent p-0 m-auto
        ${maxWidth} w-[calc(100%-2rem)]
        outline-none
      `.trim()}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRING_FLOW}
            className="bg-void-overlay border border-edge-default rounded-[var(--radius-xl)] shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
            <div className="p-6">
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2 className="text-lg font-display font-semibold text-text-bright">
                        {title}
                      </h2>
                    )}
                    {description && <p className="text-sm text-text-dim mt-1">{description}</p>}
                  </div>
                  {showClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-[var(--radius-sm)] text-text-faint hover:text-text-dim hover:bg-void-raised transition-colors duration-150 cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
