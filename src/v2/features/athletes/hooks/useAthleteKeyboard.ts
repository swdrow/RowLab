import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import type { Athlete } from '../../../types/athletes';
import type { useAthleteSelection } from './useAthleteSelection';

// ============================================
// TYPES
// ============================================

interface UseAthleteKeyboardConfig {
  /** Filtered/visible athletes list */
  athletes: Athlete[];
  /** Ref to the search input for "/" focus */
  searchInputRef: RefObject<HTMLInputElement>;
  /** Callback when user presses E/Enter on focused athlete */
  onEdit: (athlete: Athlete) => void;
  /** Callback when user presses Enter (or future shortcut) to view profile */
  onViewProfile: (athlete: Athlete) => void;
  /** Selection state from useAthleteSelection */
  selection: ReturnType<typeof useAthleteSelection>;
  /** Master toggle — disables all keyboard shortcuts when false */
  isEnabled: boolean;
}

interface UseAthleteKeyboardReturn {
  /** Index of the keyboard-focused row (-1 when inactive) */
  focusedIndex: number;
  /** Manually set focused index (e.g., on mouse hover) */
  setFocusedIndex: (index: number) => void;
  /** Whether the keyboard shortcuts help overlay is visible */
  isShortcutsHelpOpen: boolean;
  /** Toggle the shortcuts help overlay */
  setIsShortcutsHelpOpen: (open: boolean) => void;
}

// ============================================
// CONTEXT CHECKS
// ============================================

/** Tags that indicate the user is typing in a form field */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Returns true if the keyboard event should be ignored because
 * the user is focused on an input field, dialog, or the command palette.
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
 * Keyboard shortcut handler for the athletes roster page.
 *
 * Shortcuts:
 * - J / ArrowDown: Move focus down
 * - K / ArrowUp: Move focus up
 * - /: Focus search input
 * - E / Enter: Edit focused athlete
 * - X: Toggle selection on focused athlete
 * - Escape: Clear focus, blur search
 * - ?: Toggle shortcuts help overlay
 *
 * All shortcuts are context-aware and skip when the user is
 * typing in input fields, dialogs, or the command palette.
 *
 * Note: This hook registers the keydown listener but does NOT
 * attach to any specific DOM element. It is wired into the
 * roster page component in Plan 28-07.
 */
export function useAthleteKeyboard(config: UseAthleteKeyboardConfig): UseAthleteKeyboardReturn {
  const { athletes, searchInputRef, onEdit, onViewProfile, selection, isEnabled } = config;

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Keep a stable ref to athletes length so we can clamp in the handler
  const athletesLengthRef = useRef(athletes.length);
  athletesLengthRef.current = athletes.length;

  // Reset focused index when athlete list changes (e.g., filter applied)
  useEffect(() => {
    if (focusedIndex >= athletes.length) {
      setFocusedIndex(athletes.length > 0 ? athletes.length - 1 : -1);
    }
  }, [athletes.length, focusedIndex]);

  // Auto-scroll focused row into view
  useEffect(() => {
    if (focusedIndex < 0) return;

    // Find the row element by data attribute
    const row = document.querySelector(`[data-athlete-index="${focusedIndex}"]`);
    if (row) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      // The "?" shortcut uses Shift+/ — allow it even in some contexts
      // but still skip inside inputs
      if (shouldIgnoreEvent(e)) {
        // Exception: Escape should still work to blur the search input
        if (e.key === 'Escape') {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' && searchInputRef.current === target) {
            e.preventDefault();
            searchInputRef.current.blur();
            return;
          }
        }
        return;
      }

      const maxIndex = athletesLengthRef.current - 1;

      switch (e.key) {
        // ---- NAVIGATION ----
        case 'j':
        case 'ArrowDown': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (maxIndex < 0) return -1;
            const next = prev < 0 ? 0 : Math.min(prev + 1, maxIndex);
            return next;
          });
          break;
        }

        case 'k':
        case 'ArrowUp': {
          e.preventDefault();
          setFocusedIndex((prev) => {
            if (maxIndex < 0) return -1;
            const next = prev <= 0 ? 0 : prev - 1;
            return next;
          });
          break;
        }

        // ---- SEARCH FOCUS ----
        case '/': {
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        }

        // ---- EDIT ----
        case 'e':
        case 'Enter': {
          if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
            e.preventDefault();
            const athlete = athletes[focusedIndex];
            if (athlete) {
              onEdit(athlete);
            }
          }
          break;
        }

        // ---- SELECT ----
        case 'x': {
          if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
            e.preventDefault();
            const athlete = athletes[focusedIndex];
            if (athlete) {
              selection.toggleSelection(athlete.id);
            }
          }
          break;
        }

        // ---- ESCAPE ----
        case 'Escape': {
          e.preventDefault();
          if (isShortcutsHelpOpen) {
            setIsShortcutsHelpOpen(false);
          } else {
            setFocusedIndex(-1);
            searchInputRef.current?.blur();
          }
          break;
        }

        // ---- HELP ----
        case '?': {
          e.preventDefault();
          setIsShortcutsHelpOpen((prev) => !prev);
          break;
        }

        default:
          break;
      }
    },
    [
      isEnabled,
      athletes,
      focusedIndex,
      isShortcutsHelpOpen,
      onEdit,
      onViewProfile,
      searchInputRef,
      selection,
    ]
  );

  // Register global keydown listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    isShortcutsHelpOpen,
    setIsShortcutsHelpOpen,
  };
}
