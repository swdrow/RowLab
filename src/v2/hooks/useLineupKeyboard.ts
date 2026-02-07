import { useEffect } from 'react';
import { useLineupCommands } from './useLineupCommands';

/**
 * useLineupKeyboard - Keyboard shortcut handler for lineup builder
 *
 * Handles:
 * - Ctrl+Z / Cmd+Z: Undo last action
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo undone action
 * - Ctrl+Y / Cmd+Y: Redo (Windows standard alternative)
 *
 * Per CONTEXT.md:
 * "Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z (standard)"
 * "Undo/redo covers every action - each drag, swap, removal is individually undoable"
 *
 * Migrated to V2 command-based undo/redo (Phase 29-02).
 * Uses useLineupCommands instead of V1 lineupStore.
 *
 * Only active when lineup builder is mounted - cleans up on unmount.
 *
 * @param lineupId - Current lineup ID (null if no lineup active)
 * @param cancelAutoSave - Callback to cancel pending auto-save before undo
 */
export function useLineupKeyboard(lineupId: string | null, cancelAutoSave?: () => void) {
  const { undo, redo } = useLineupCommands(lineupId, cancelAutoSave);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // Also support Ctrl/Cmd + Y for redo (Windows standard)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
}
