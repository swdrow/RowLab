import { useEffect, useCallback } from 'react';
import useLineupStore from '../store/lineupStore';

/**
 * Hook for lineup keyboard shortcuts
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 * - Cmd/Ctrl+S: Save (calls onSave callback)
 * - Escape: Clear selection
 */
export function useLineupKeyboardShortcuts({ onSave, enabled = true }) {
  const { undo, redo, clearSeatSelection, clearAthleteSelection } = useLineupStore();

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Skip if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const isMod = e.metaKey || e.ctrlKey;

    // Undo: Cmd/Ctrl+Z
    if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo?.();
    }

    // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
    if ((isMod && e.key === 'z' && e.shiftKey) || (isMod && e.key === 'y')) {
      e.preventDefault();
      redo?.();
    }

    // Save: Cmd/Ctrl+S
    if (isMod && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }

    // Escape: Clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSeatSelection();
      clearAthleteSelection();
    }
  }, [enabled, undo, redo, onSave, clearSeatSelection, clearAthleteSelection]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}

export default useLineupKeyboardShortcuts;
