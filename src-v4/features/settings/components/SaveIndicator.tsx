/**
 * Inline save feedback indicator -- shows "Saved" checkmark or error message.
 * Uses motion/react for enter/exit animations.
 * Design tokens: text-data-good (saved), text-accent-coral (error).
 */
import { AnimatePresence, motion } from 'motion/react';
import { IconCheck, IconXCircle } from '@/components/icons';

interface SaveIndicatorProps {
  status: 'idle' | 'saved' | 'error';
  errorMessage?: string;
}

export function SaveIndicator({ status, errorMessage }: SaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {status === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-1 text-xs text-data-good"
        >
          <IconCheck className="w-3 h-3" />
          Saved
        </motion.span>
      )}
      {status === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-1 text-xs text-accent-coral"
        >
          <IconXCircle className="w-3 h-3" />
          {errorMessage || 'Save failed'}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
