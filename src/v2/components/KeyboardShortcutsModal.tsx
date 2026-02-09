import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { getShortcutsByCategory } from '../lib/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  palette: 'Command Palette',
  actions: 'Quick Actions',
  navigation: 'Navigation',
  editing: 'Editing',
};

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = getShortcutsByCategory();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="relative w-full max-w-2xl rounded-xl border border-bdr-default bg-surface-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bdr-subtle p-6">
              <div>
                <h2 className="text-lg font-semibold text-txt-primary">Keyboard Shortcuts</h2>
                <p className="text-sm text-txt-secondary">
                  Navigate faster with keyboard shortcuts
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-txt-secondary transition-colors hover:bg-surface-hover hover:text-txt-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-medium text-txt-secondary">
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between rounded-lg border border-bdr-subtle bg-surface-base px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-medium text-txt-primary">
                              {shortcut.label}
                            </div>
                            {shortcut.description && (
                              <div className="text-xs text-txt-secondary">
                                {shortcut.description}
                              </div>
                            )}
                          </div>
                          <kbd className="inline-flex items-center gap-1 rounded border border-bdr-default bg-surface-elevated px-2 py-1 font-mono text-xs text-txt-primary shadow-sm">
                            {shortcut.displayKeys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-bdr-subtle p-4">
              <p className="text-center text-xs text-txt-secondary">
                Press{' '}
                <kbd className="rounded border border-bdr-default bg-surface-elevated px-1.5 py-0.5 font-mono text-xs">
                  ?
                </kbd>{' '}
                to show this dialog, or{' '}
                <kbd className="rounded border border-bdr-default bg-surface-elevated px-1.5 py-0.5 font-mono text-xs">
                  Esc
                </kbd>{' '}
                to close
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
