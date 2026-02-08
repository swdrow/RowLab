import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from '@phosphor-icons/react';
import type { TrainingShortcut } from '../../../hooks/useTrainingKeyboard';

// ============================================
// TYPES
// ============================================

interface TrainingShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: TrainingShortcut[];
}

// ============================================
// KEY BADGE COMPONENT
// ============================================

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5
                 rounded-md bg-bg-surface border border-bdr-default
                 text-[11px] font-mono font-medium text-txt-secondary
                 shadow-sm"
    >
      {label}
    </kbd>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Keyboard shortcuts help overlay for training/attendance pages.
 *
 * Glass-card panel positioned in the top-right area.
 * Lists all available keyboard shortcuts dynamically based on what's active.
 *
 * Dismisses on:
 * - Escape key press (handled by parent useTrainingKeyboard hook)
 * - Click outside the panel
 */
export function TrainingShortcutsHelp({ isOpen, onClose, shortcuts }: TrainingShortcutsHelpProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Dismiss on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Delay adding listener to avoid immediate close from the "?" keypress
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const availableShortcuts = shortcuts.filter((s) => s.available);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed top-20 right-6 z-50 w-[260px]
                     bg-bg-surface-elevated/95 backdrop-blur-xl
                     border border-bdr-default rounded-xl
                     shadow-2xl p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Keyboard size={16} weight="duotone" className="text-interactive-primary" />
              <span className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
                Shortcuts
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-bg-hover transition-colors"
              aria-label="Close shortcuts help"
            >
              <X size={14} className="text-txt-tertiary" />
            </button>
          </div>

          {/* Shortcuts list */}
          <div className="space-y-1.5">
            {availableShortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between gap-3 py-0.5">
                <span className="text-xs text-txt-secondary">{shortcut.description}</span>
                <KeyBadge label={shortcut.key} />
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="mt-3 pt-2 border-t border-bdr-default">
            <p className="text-[10px] text-txt-tertiary">
              Press <KeyBadge label="?" /> to toggle this overlay
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
