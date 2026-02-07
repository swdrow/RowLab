import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from '@phosphor-icons/react';

// ============================================
// TYPES
// ============================================

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// SHORTCUT DATA
// ============================================

interface ShortcutEntry {
  keys: string[];
  description: string;
}

const NAVIGATION_SHORTCUTS: ShortcutEntry[] = [
  { keys: ['J', 'K'], description: 'Navigate up/down' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['Esc'], description: 'Clear focus' },
];

const ACTION_SHORTCUTS: ShortcutEntry[] = [
  { keys: ['E'], description: 'Edit athlete' },
  { keys: ['X'], description: 'Toggle selection' },
  { keys: ['Shift', 'Click'], description: 'Range select' },
  { keys: ['?'], description: 'Toggle this help' },
];

// ============================================
// KEY BADGE COMPONENT
// ============================================

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5
                 rounded-md bg-surface-primary border border-bdr-secondary
                 text-[11px] font-mono font-medium text-txt-secondary
                 shadow-sm"
    >
      {label}
    </kbd>
  );
}

// ============================================
// SHORTCUT ROW
// ============================================

function ShortcutRow({ entry }: { entry: ShortcutEntry }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-txt-secondary">{entry.description}</span>
      <div className="flex items-center gap-1">
        {entry.keys.map((key, i) => (
          <span key={key} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-[10px] text-txt-tertiary mx-0.5">+</span>}
            <KeyBadge label={key} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Keyboard shortcuts help overlay.
 *
 * Small glass-card panel positioned in the top-right of the roster content.
 * Lists all available keyboard shortcuts in two sections: Navigation and Actions.
 *
 * Dismisses on:
 * - Escape key press (handled by parent useAthleteKeyboard hook)
 * - Click outside the panel
 */
export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-2 right-2 z-50 w-[260px]
                     bg-card-bg/95 backdrop-blur-xl
                     border border-bdr-primary rounded-xl
                     shadow-2xl p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Keyboard size={16} weight="duotone" className="text-accent-secondary" />
              <span className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
                Shortcuts
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-surface-hover transition-colors"
              aria-label="Close shortcuts help"
            >
              <X size={14} className="text-txt-tertiary" />
            </button>
          </div>

          {/* Navigation section */}
          <div className="mb-3">
            <p className="text-[10px] font-medium text-txt-tertiary uppercase tracking-wider mb-1.5">
              Navigation
            </p>
            <div className="space-y-0.5">
              {NAVIGATION_SHORTCUTS.map((entry) => (
                <ShortcutRow key={entry.description} entry={entry} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-bdr-secondary my-2" />

          {/* Actions section */}
          <div>
            <p className="text-[10px] font-medium text-txt-tertiary uppercase tracking-wider mb-1.5">
              Actions
            </p>
            <div className="space-y-0.5">
              {ACTION_SHORTCUTS.map((entry) => (
                <ShortcutRow key={entry.description} entry={entry} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
