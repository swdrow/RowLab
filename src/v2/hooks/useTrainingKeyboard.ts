import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

// ============================================
// TYPES
// ============================================

interface UseTrainingKeyboardConfig {
  /** Called when N is pressed — create new session/workout */
  onNewSession?: () => void;
  /** Called when R is pressed — refresh data */
  onRefresh?: () => void;
  /** Called when Escape is pressed — close open panels/modals */
  onEscape?: () => void;
  /** Called when T is pressed — toggle calendar view (month/week) */
  onToggleView?: () => void;
  /** Master toggle — disables all keyboard shortcuts when false */
  enabled?: boolean;
}

interface UseTrainingKeyboardReturn {
  /** Whether the keyboard shortcuts help overlay is visible */
  showHelp: boolean;
  /** Toggle the help overlay */
  setShowHelp: (show: boolean) => void;
}

// ============================================
// CONTEXT CHECKS
// ============================================

/** Tags that indicate the user is typing in a form field */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Returns true if the keyboard event should be ignored because
 * the user is focused on an input field, dialog, or the command palette.
 *
 * Based on Phase 28-03 decision: shouldIgnoreEvent guard.
 */
function shouldIgnoreEvent(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;

  // Skip if focus is in a form input
  if (INPUT_TAGS.has(target.tagName)) return true;

  // Skip if target is contentEditable
  if (target.isContentEditable) return true;

  // Skip if Cmd+K command palette is open
  if (document.querySelector('[cmdk-dialog]')) return true;

  // Skip if any modal/dialog is open
  if (document.querySelector('[role="dialog"]')) return true;

  return false;
}

// ============================================
// HOOK
// ============================================

/**
 * Keyboard shortcut handler for training/attendance pages.
 *
 * Shortcuts:
 * - N: Create new session (opens SessionForm) — skip if in input/textarea/dialog
 * - R: Refresh data (invalidate training/session/attendance queries)
 * - ?: Show help overlay (keyboard shortcut reference card)
 * - Escape: Close any open panel, modal, or form
 * - T: Toggle calendar view (month/week) — optional, if onToggleView provided
 *
 * All shortcuts are context-aware and skip when the user is
 * typing in input fields, dialogs, or the command palette.
 */
export function useTrainingKeyboard(
  config: UseTrainingKeyboardConfig = {}
): UseTrainingKeyboardReturn {
  const { onNewSession, onRefresh, onEscape, onToggleView, enabled = true } = config;

  const [showHelp, setShowHelp] = useState(false);
  const queryClient = useQueryClient();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Allow Escape even in some contexts (dismiss help overlay)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showHelp) {
          setShowHelp(false);
        } else if (onEscape) {
          onEscape();
        }
        return;
      }

      // For all other shortcuts, skip when in input contexts
      if (shouldIgnoreEvent(e)) return;

      switch (e.key) {
        // ---- NEW SESSION ----
        case 'n':
        case 'N': {
          if (onNewSession) {
            e.preventDefault();
            onNewSession();
          }
          break;
        }

        // ---- REFRESH ----
        case 'r':
        case 'R': {
          e.preventDefault();
          if (onRefresh) {
            onRefresh();
          } else {
            // Default: invalidate training/session/attendance queries
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.trainingPlans.all });
            queryClient.invalidateQueries({ queryKey: ['workouts'] });
            queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
            queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
          }
          break;
        }

        // ---- TOGGLE VIEW ----
        case 't':
        case 'T': {
          if (onToggleView) {
            e.preventDefault();
            onToggleView();
          }
          break;
        }

        // ---- HELP OVERLAY ----
        case '?': {
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        }

        default:
          break;
      }
    },
    [enabled, showHelp, onNewSession, onRefresh, onEscape, onToggleView, queryClient]
  );

  // Register global keydown listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showHelp,
    setShowHelp,
  };
}

// ============================================
// HELP OVERLAY COMPONENT
// ============================================

export interface TrainingShortcut {
  key: string;
  description: string;
  available: boolean;
}

/**
 * Returns the list of available shortcuts based on which callbacks are provided.
 * Useful for rendering the help overlay.
 */
export function getTrainingShortcuts(config: {
  hasNewSession?: boolean;
  hasRefresh?: boolean;
  hasEscape?: boolean;
  hasToggleView?: boolean;
}): TrainingShortcut[] {
  return [
    { key: 'N', description: 'Create new session', available: config.hasNewSession ?? false },
    { key: 'R', description: 'Refresh data', available: config.hasRefresh ?? true },
    { key: 'T', description: 'Toggle calendar view', available: config.hasToggleView ?? false },
    { key: '?', description: 'Show keyboard shortcuts', available: true },
    {
      key: 'Esc',
      description: 'Close panel / dismiss overlay',
      available: config.hasEscape ?? true,
    },
  ];
}
