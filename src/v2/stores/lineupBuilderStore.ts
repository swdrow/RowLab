import { create } from 'zustand';

/**
 * UI-only Zustand store for lineup builder interactions
 *
 * Phase 25-06: Split from lineupStore.js
 * - Contains ONLY UI state (selections, drag, undo/redo)
 * - NO server state (lineups, assignments come from useLineupDraft)
 * - NO persist middleware (session-only, resets on refresh)
 * - Undo/redo is in-memory only
 */

/**
 * Drag source location
 */
export interface DragSource {
  type: 'bank' | 'seat';
  boatId?: string;
  seatNumber?: number;
}

/**
 * Undo action types
 */
export type UndoActionType = 'assignAthlete' | 'removeAthlete' | 'swapAthletes';

/**
 * Undo action descriptor
 */
export interface UndoAction {
  type: UndoActionType;
  timestamp: number;
  // Action-specific data for reversal
  data: {
    athleteId?: string;
    boatId?: string;
    seatNumber?: number;
    isCoxswain?: boolean;
    // For swap actions
    athlete1Id?: string;
    boat1Id?: string;
    seat1Number?: number;
    isCoxswain1?: boolean;
    athlete2Id?: string;
    boat2Id?: string;
    seat2Number?: number;
    isCoxswain2?: boolean;
  };
}

/**
 * Lineup builder UI state
 */
interface LineupBuilderState {
  // Selection state
  selectedAthlete: string | null;
  selectedSeats: Array<{ boatId: string; seatNumber: number; isCoxswain?: boolean }>;

  // Drag state
  draggedAthlete: string | null;
  dragSource: DragSource | null;

  // Undo/redo (session-only, resets on refresh)
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Actions
  selectAthlete: (id: string | null) => void;
  selectSeat: (boatId: string, seatNumber: number, isCoxswain?: boolean) => void;
  toggleSeatSelection: (boatId: string, seatNumber: number, isCoxswain?: boolean) => void;
  clearSelection: () => void;
  setDraggedAthlete: (id: string | null, source?: DragSource) => void;
  pushUndo: (action: UndoAction) => void;
  undo: () => UndoAction | undefined;
  redo: () => UndoAction | undefined;
  resetUndoHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/**
 * Create lineup builder store
 */
export const useLineupBuilderStore = create<LineupBuilderState>((set, get) => ({
  // Initial state
  selectedAthlete: null,
  selectedSeats: [],
  draggedAthlete: null,
  dragSource: null,
  undoStack: [],
  redoStack: [],

  // Select athlete from bank
  selectAthlete: (id) => {
    set({ selectedAthlete: id });
  },

  // Select a single seat (replace selection)
  selectSeat: (boatId, seatNumber, isCoxswain = false) => {
    set({
      selectedSeats: [{ boatId, seatNumber, isCoxswain }],
    });
  },

  // Toggle seat selection (for multi-select swap)
  toggleSeatSelection: (boatId, seatNumber, isCoxswain = false) => {
    const { selectedSeats } = get();
    const existing = selectedSeats.find(
      (s) => s.boatId === boatId && s.seatNumber === seatNumber && s.isCoxswain === isCoxswain
    );

    if (existing) {
      // Deselect
      set({
        selectedSeats: selectedSeats.filter((s) => s !== existing),
      });
    } else {
      // Select (max 2 seats for swapping)
      const newSelection = { boatId, seatNumber, isCoxswain };
      const newSelectedSeats =
        selectedSeats.length >= 2
          ? [selectedSeats[1], newSelection]
          : [...selectedSeats, newSelection];

      set({ selectedSeats: newSelectedSeats });
    }
  },

  // Clear all selections
  clearSelection: () => {
    set({
      selectedAthlete: null,
      selectedSeats: [],
    });
  },

  // Set dragged athlete
  setDraggedAthlete: (id, source) => {
    set({
      draggedAthlete: id,
      dragSource: source || null,
    });
  },

  // Push undo action
  pushUndo: (action) => {
    const { undoStack } = get();
    set({
      undoStack: [...undoStack, action],
      redoStack: [], // Clear redo stack on new action
    });
  },

  // Undo last action
  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return undefined;

    const action = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [action, ...redoStack],
    });

    return action;
  },

  // Redo last undone action
  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return undefined;

    const action = redoStack[0];
    set({
      undoStack: [...undoStack, action],
      redoStack: redoStack.slice(1),
    });

    return action;
  },

  // Reset undo/redo history
  resetUndoHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
    });
  },

  // Check if undo is available
  canUndo: () => {
    return get().undoStack.length > 0;
  },

  // Check if redo is available
  canRedo: () => {
    return get().redoStack.length > 0;
  },
}));
