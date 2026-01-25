import React, { Fragment } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SPRING_CONFIG, usePrefersReducedMotion, TRANSITION_DURATION } from '../../utils/animations';
import { IconButton } from './Button';

/**
 * Modal - Animated modal dialog component
 *
 * Features:
 * - Headless UI Dialog for focus trapping and accessibility
 * - Framer Motion AnimatePresence for animations
 * - Backdrop blur with fade
 * - Panel slide+fade+scale animation
 * - Four sizes: sm, md, lg, xl
 * - Optional title, description, close button
 * - Scrollable content area
 * - ModalFooter component for actions
 * - Reduced motion support
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  size = 'md',
  title,
  description,
  showCloseButton = true,
  children,
  className,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Animation variants
  const backdropVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };

  const panelVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: {
          opacity: 0,
          scale: 0.95,
          y: 20,
        },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
        },
      };

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : SPRING_CONFIG;

  const backdropTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: TRANSITION_DURATION.normal };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          as="div"
          static
          open={open}
          onClose={onClose}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={backdropTransition}
          >
            <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </motion.div>

          {/* Panel container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={panelVariants}
              transition={transitionConfig}
              className="w-full"
            >
              <DialogPanel
                className={cn(
                  'w-full mx-auto',
                  'bg-[var(--color-bg-surface-elevated)]',
                  'rounded-xl shadow-2xl',
                  'border border-[var(--color-border-subtle)]',
                  'flex flex-col',
                  'max-h-[90vh]',
                  sizeStyles[size],
                  className
                )}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <DialogTitle className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {title}
                        </DialogTitle>
                      )}
                      {description && (
                        <Description className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {description}
                        </Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <IconButton
                        icon={<X className="w-4 h-4" />}
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="flex-shrink-0 -mr-2 -mt-1"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 overflow-y-auto px-6',
                    title || showCloseButton ? 'pb-6' : 'py-6'
                  )}
                >
                  {children}
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

Modal.displayName = 'Modal';

/**
 * ModalFooter - Footer section for modal actions
 *
 * Provides consistent spacing and alignment for action buttons.
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4',
        'border-t border-[var(--color-border-subtle)]',
        'bg-[var(--color-bg-surface)]',
        'rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

ModalFooter.displayName = 'ModalFooter';

/**
 * ModalContent - Content wrapper with default padding
 *
 * Optional wrapper when you need extra content organization.
 */
export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
};

ModalContent.displayName = 'ModalContent';
