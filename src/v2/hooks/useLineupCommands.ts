import { useState, useCallback } from 'react';
import type { LineupAssignment } from './useLineups';

/**
 * Command interface for undo/redo pattern
 *
 * Each command encapsulates a reversible action that triggers a TanStack Query mutation.
 */
export interface LineupCommand {
  execute: () => Promise<void>; // Forward action (triggers mutation)
  undo: () => Promise<void>; // Reverse action (triggers mutation)
  description: string; // For screen reader announcements
}

/**
 * Mutation functions passed to command factories
 */
type AssignMutationFn = (params: {
  athleteId: string;
  seatNumber: number;
  boatId: string;
  isCoxswain: boolean;
}) => Promise<void>;

type RemoveMutationFn = (params: {
  athleteId: string;
  seatNumber: number;
  boatId: string;
  isCoxswain: boolean;
}) => Promise<void>;

type SwapMutationFn = (params: {
  assignment1: LineupAssignment;
  assignment2: LineupAssignment;
}) => Promise<void>;

/**
 * Create command for assigning athlete to seat
 *
 * Execute: assign athlete to seat
 * Undo: remove athlete from seat
 */
export function createAssignCommand(
  _lineupId: string,
  athleteId: string,
  seatNumber: number,
  boatId: string,
  isCoxswain: boolean,
  assignMutation: AssignMutationFn,
  removeMutation: RemoveMutationFn
): LineupCommand {
  return {
    execute: async () => {
      await assignMutation({ athleteId, seatNumber, boatId, isCoxswain });
    },
    undo: async () => {
      await removeMutation({ athleteId, seatNumber, boatId, isCoxswain });
    },
    description: `Assign athlete to ${isCoxswain ? 'cox' : `seat ${seatNumber}`}`,
  };
}

/**
 * Create command for removing athlete from seat
 *
 * Execute: remove athlete from seat
 * Undo: assign athlete back to seat
 */
export function createRemoveCommand(
  _lineupId: string,
  athleteId: string,
  seatNumber: number,
  boatId: string,
  isCoxswain: boolean,
  assignMutation: AssignMutationFn,
  removeMutation: RemoveMutationFn
): LineupCommand {
  return {
    execute: async () => {
      await removeMutation({ athleteId, seatNumber, boatId, isCoxswain });
    },
    undo: async () => {
      await assignMutation({ athleteId, seatNumber, boatId, isCoxswain });
    },
    description: `Remove athlete from ${isCoxswain ? 'cox' : `seat ${seatNumber}`}`,
  };
}

/**
 * Create command for swapping two athletes
 *
 * Execute: swap A <-> B
 * Undo: swap B <-> A (same operation)
 */
export function createSwapCommand(
  _lineupId: string,
  assignment1: LineupAssignment,
  assignment2: LineupAssignment,
  swapMutation: SwapMutationFn
): LineupCommand {
  return {
    execute: async () => {
      await swapMutation({ assignment1, assignment2 });
    },
    undo: async () => {
      // Swap is symmetric - undoing a swap is the same as swapping again
      await swapMutation({ assignment1: assignment2, assignment2: assignment1 });
    },
    description: `Swap athletes in seats ${assignment1.seatNumber} and ${assignment2.seatNumber}`,
  };
}

/**
 * Hook for command-based undo/redo with TanStack Query mutations
 *
 * Features:
 * - Session-only undo/redo stacks (resets on refresh, per Phase 25-06)
 * - Cancels auto-save before undo to prevent race conditions
 * - Clears redo stack on new action
 * - Each command triggers real mutations (not just state descriptors)
 *
 * @param lineupId - Current lineup ID
 * @param cancelAutoSave - Callback to cancel pending auto-save (from useLineupDraft)
 */
export function useLineupCommands(_lineupId: string | null, cancelAutoSave?: () => void) {
  // Session-only stacks (no localStorage - resets on page refresh)
  const [undoStack, setUndoStack] = useState<LineupCommand[]>([]);
  const [redoStack, setRedoStack] = useState<LineupCommand[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  /**
   * Execute a command and add to undo stack
   */
  const executeCommand = useCallback(async (cmd: LineupCommand) => {
    await cmd.execute();

    // Push to undo stack
    setUndoStack((prev) => [...prev, cmd]);

    // Clear redo stack on new action
    setRedoStack([]);

    // Track last action for UI
    setLastAction(cmd.description);
  }, []);

  /**
   * Undo last action
   */
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    // CRITICAL: Cancel auto-save before undo to prevent race condition with 4-second debounce
    if (cancelAutoSave) {
      cancelAutoSave();
    }

    const cmd = undoStack[undoStack.length - 1];
    if (!cmd) return; // TypeScript guard

    await cmd.undo();

    // Move from undo to redo stack
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [cmd, ...prev]);

    // Update last action
    setLastAction(`Undo: ${cmd.description}`);
  }, [undoStack, cancelAutoSave]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const cmd = redoStack[0];
    if (!cmd) return; // TypeScript guard

    await cmd.execute();

    // Move from redo to undo stack
    setRedoStack((prev) => prev.slice(1));
    setUndoStack((prev) => [...prev, cmd]);

    // Update last action
    setLastAction(`Redo: ${cmd.description}`);
  }, [redoStack]);

  return {
    executeCommand,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    lastAction,
  };
}
