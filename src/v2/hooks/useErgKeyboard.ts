import { useState, useCallback, useEffect, useRef } from 'react';
import type { ErgTest } from '../types/ergTests';

// ============================================
// TYPES
// ============================================

interface UseErgKeyboardConfig {
  /** Visible/filtered erg tests list */
  tests: ErgTest[];
  /** Callback when user presses E/Enter on selected row */
  onEdit: (test: ErgTest) => void;
  /** Callback when user presses Delete/Backspace on selected row */
  onDelete: (testId: string) => void;
  /** Master toggle - disables all keyboard shortcuts when false */
  enabled: boolean;
}

interface UseErgKeyboardReturn {
  /** Index of the keyboard-selected row (-1 when inactive) */
  selectedIndex: number;
  /** Manually set selected index (e.g., on mouse hover) */
  setSelectedIndex: (index: number) => void;
  /** Whether the keyboard shortcuts help overlay is visible */
  showHelp: boolean;
  /** Toggle the shortcuts help overlay */
  setShowHelp: (open: boolean) => void;
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
 * Keyboard shortcut handler for the erg tests page.
 *
 * Shortcuts:
 * - J / ArrowDown: Move selection down
 * - K / ArrowUp: Move selection up
 * - E / Enter: Edit selected erg test
 * - Delete / Backspace: Delete selected erg test
 * - /: Focus the test type filter
 * - ?: Toggle shortcuts help overlay
 * - Escape: Clear selection / dismiss help
 *
 * All shortcuts are context-aware and skip when the user is
 * typing in input fields, dialogs, or the command palette.
 */
export function useErgKeyboard(config: UseErgKeyboardConfig): UseErgKeyboardReturn {
  const { tests, onEdit, onDelete, enabled } = config;

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);

  // Keep a stable ref to tests length so we can clamp in the handler
  const testsLengthRef = useRef(tests.length);
  testsLengthRef.current = tests.length;

  // Reset selected index when tests list changes (e.g., filter applied)
  useEffect(() => {
    if (selectedIndex >= tests.length) {
      setSelectedIndex(tests.length > 0 ? tests.length - 1 : -1);
    }
  }, [tests.length, selectedIndex]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedIndex < 0) return;

    // Find the table row by position - VirtualTable renders <tr> elements
    const tableBody = document.querySelector('tbody');
    if (tableBody) {
      const rows = tableBody.querySelectorAll('tr');
      // Account for padding rows by finding visible rows
      const visibleRows = Array.from(rows).filter((row) => row.children.length > 1);
      const targetRow = visibleRows[selectedIndex];
      if (targetRow) {
        targetRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Allow Escape even in some contexts
      if (shouldIgnoreEvent(e)) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (showHelp) {
            setShowHelp(false);
          } else {
            setSelectedIndex(-1);
          }
        }
        return;
      }

      const maxIndex = testsLengthRef.current - 1;

      switch (e.key) {
        // ---- NAVIGATION ----
        case 'j':
        case 'ArrowDown': {
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (maxIndex < 0) return -1;
            return prev < 0 ? 0 : Math.min(prev + 1, maxIndex);
          });
          break;
        }

        case 'k':
        case 'ArrowUp': {
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (maxIndex < 0) return -1;
            return prev <= 0 ? 0 : prev - 1;
          });
          break;
        }

        // ---- FILTER FOCUS ----
        case '/': {
          e.preventDefault();
          // Focus the test type filter select element
          const filterEl =
            document.querySelector<HTMLSelectElement>('[data-erg-filter]') ||
            document.querySelector<HTMLSelectElement>('select');
          if (filterEl) {
            filterEl.focus();
          }
          break;
        }

        // ---- EDIT ----
        case 'e':
        case 'Enter': {
          if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
            e.preventDefault();
            const test = tests[selectedIndex];
            if (test) {
              onEdit(test);
            }
          }
          break;
        }

        // ---- DELETE ----
        case 'Delete':
        case 'Backspace': {
          if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
            e.preventDefault();
            const test = tests[selectedIndex];
            if (test) {
              onDelete(test.id);
            }
          }
          break;
        }

        // ---- ESCAPE ----
        case 'Escape': {
          e.preventDefault();
          if (showHelp) {
            setShowHelp(false);
          } else {
            setSelectedIndex(-1);
          }
          break;
        }

        // ---- HELP ----
        case '?': {
          e.preventDefault();
          setShowHelp((prev) => !prev);
          break;
        }

        default:
          break;
      }
    },
    [enabled, tests, selectedIndex, showHelp, onEdit, onDelete]
  );

  // Register global keydown listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
    showHelp,
    setShowHelp,
  };
}
