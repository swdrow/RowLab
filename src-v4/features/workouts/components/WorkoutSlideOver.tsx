/**
 * Right-side slide-over panel for workout creation/editing.
 * Renders via React portal for proper z-index above sidebar/topbar.
 *
 * Desktop (>= 768px): slides in from the right at 400px width
 * Mobile (< 768px): full-width bottom sheet at 90vh height
 *
 * Locks body scroll while open. Closes on backdrop click or X button.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from '@/components/icons';

import { SPRING_GENTLE } from '@/lib/animations';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { WorkoutForm } from './WorkoutForm';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WorkoutSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  editingWorkout: Workout | null;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/* WorkoutSlideOver                                                    */
/* ------------------------------------------------------------------ */

export function WorkoutSlideOver({
  isOpen,
  onClose,
  editingWorkout,
  onSuccess,
}: WorkoutSlideOverProps) {
  const isMobile = useIsMobile();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const title = editingWorkout ? 'Edit Workout' : 'New Workout';

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          {isMobile ? (
            /* Mobile: bottom sheet */
            <motion.div
              key="panel"
              className="fixed bottom-0 left-0 right-0 z-50 h-[90vh] bg-void-surface border-t border-edge-default rounded-t-2xl flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING_GENTLE}
            >
              <SlideOverHeader title={title} onClose={onClose} />
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                <WorkoutForm
                  key={editingWorkout?.id ?? 'new'}
                  editingWorkout={editingWorkout}
                  onSuccess={onSuccess}
                />
              </div>
            </motion.div>
          ) : (
            /* Desktop: right panel */
            <motion.div
              key="panel"
              className="fixed top-0 right-0 h-full z-50 w-[400px] bg-void-surface border-l border-edge-default flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRING_GENTLE}
            >
              <SlideOverHeader title={title} onClose={onClose} />
              <div className="flex-1 overflow-y-auto px-5 pb-8">
                <WorkoutForm
                  key={editingWorkout?.id ?? 'new'}
                  editingWorkout={editingWorkout}
                  onSuccess={onSuccess}
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function SlideOverHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-edge-default shrink-0">
      <h2 className="text-lg font-display font-semibold text-text-bright">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-md hover:bg-void-overlay transition-colors"
        aria-label="Close"
      >
        <IconX width={18} height={18} className="text-text-faint" />
      </button>
    </div>
  );
}
