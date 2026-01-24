import { useEffect } from 'react';
import useLineupStore from '@/store/lineupStore';

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
 * Only active when lineup builder is mounted - cleans up on unmount.
 */
export function useLineupKeyboard() {
  const undo = useLineupStore((state) => state.undo);
  const redo = useLineupStore((state) => state.redo);

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
