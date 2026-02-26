/**
 * Local lineup editing state with undo/redo.
 *
 * This is a useReducer-based state machine for editing lineups in the UI.
 * Server state is managed by TanStack Query (see api.ts) -- this hook manages
 * the ephemeral editing state: boats, seat assignments, and drag-drop operations.
 *
 * History management: every mutation (except SELECT_ATHLETE, LOAD_LINEUP)
 * pushes current state to history.past and clears future. Max 50 entries.
 */
import { useReducer, useCallback, useMemo } from 'react';
import type { BoatClass, LineupBoat, LineupAssignment, Lineup, Side } from '../types';
import { createEmptyBoat, BOAT_SEAT_COUNTS, BOAT_HAS_COXSWAIN } from '../types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface LineupState {
  boats: LineupBoat[];
  unassigned: string[]; // athlete IDs not in any boat
  selectedAthleteId: string | null;
  isDirty: boolean;
}

interface LineupStateWithHistory extends LineupState {
  history: {
    past: LineupState[];
    future: LineupState[];
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type LineupAction =
  | { type: 'ADD_BOAT'; boatClass: BoatClass; shellName?: string }
  | { type: 'REMOVE_BOAT'; boatIndex: number }
  | {
      type: 'ASSIGN_ATHLETE';
      athleteId: string;
      boatIndex: number;
      seatNumber: number;
    }
  | { type: 'ASSIGN_COXSWAIN'; athleteId: string; boatIndex: number }
  | { type: 'UNASSIGN_ATHLETE'; athleteId: string }
  | {
      type: 'SWAP_ATHLETES';
      sourceAthleteId: string;
      targetAthleteId: string;
    }
  | {
      type: 'MOVE_ATHLETE';
      athleteId: string;
      targetBoatIndex: number;
      targetSeatNumber: number;
    }
  | { type: 'SELECT_ATHLETE'; athleteId: string | null }
  | { type: 'LOAD_LINEUP'; lineup: Lineup; allAthleteIds: string[] }
  | { type: 'CLEAR' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export type { LineupAction };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function createInitialState(): LineupStateWithHistory {
  return {
    boats: [],
    unassigned: [],
    selectedAthleteId: null,
    isDirty: false,
    history: { past: [], future: [] },
  };
}

// ---------------------------------------------------------------------------
// State snapshot helpers (strip history for undo stack)
// ---------------------------------------------------------------------------

function snapshot(state: LineupStateWithHistory): LineupState {
  return {
    boats: state.boats,
    unassigned: state.unassigned,
    selectedAthleteId: state.selectedAthleteId,
    isDirty: state.isDirty,
  };
}

function pushHistory(state: LineupStateWithHistory): LineupStateWithHistory['history'] {
  const past = [...state.history.past, snapshot(state)];
  // Cap history at MAX_HISTORY
  if (past.length > MAX_HISTORY) {
    past.shift();
  }
  return { past, future: [] };
}

// ---------------------------------------------------------------------------
// Athlete location helpers
// ---------------------------------------------------------------------------

interface AthleteLocation {
  boatIndex: number;
  seatNumber: number; // 0 = coxswain
}

function findAthlete(boats: LineupBoat[], athleteId: string): AthleteLocation | null {
  for (let bi = 0; bi < boats.length; bi++) {
    const boat = boats[bi]!;
    // Check coxswain
    if (boat.coxswainId === athleteId) {
      return { boatIndex: bi, seatNumber: 0 };
    }
    // Check seats
    for (const seat of boat.seats) {
      if (seat.athleteId === athleteId) {
        return { boatIndex: bi, seatNumber: seat.seatNumber };
      }
    }
  }
  return null;
}

function removeAthleteFromBoats(boats: LineupBoat[], athleteId: string): LineupBoat[] {
  return boats.map((boat) => ({
    ...boat,
    coxswainId: boat.coxswainId === athleteId ? null : boat.coxswainId,
    seats: boat.seats.map((seat) =>
      seat.athleteId === athleteId ? { ...seat, athleteId: null } : seat
    ),
  }));
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function lineupReducer(
  state: LineupStateWithHistory,
  action: LineupAction
): LineupStateWithHistory {
  switch (action.type) {
    // -------------------------------------------------------------------
    // ADD_BOAT: add a new empty boat
    // -------------------------------------------------------------------
    case 'ADD_BOAT': {
      const newBoat = createEmptyBoat(action.boatClass, action.shellName);
      return {
        ...state,
        boats: [...state.boats, newBoat],
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // REMOVE_BOAT: remove boat, move its athletes to unassigned
    // -------------------------------------------------------------------
    case 'REMOVE_BOAT': {
      const boat = state.boats[action.boatIndex];
      if (!boat) return state;

      // Collect athlete IDs from the removed boat
      const freedAthletes: string[] = [];
      if (boat.coxswainId) freedAthletes.push(boat.coxswainId);
      for (const seat of boat.seats) {
        if (seat.athleteId) freedAthletes.push(seat.athleteId);
      }

      return {
        ...state,
        boats: state.boats.filter((_, i) => i !== action.boatIndex),
        unassigned: [...state.unassigned, ...freedAthletes],
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // ASSIGN_ATHLETE: place athlete in a specific seat
    // -------------------------------------------------------------------
    case 'ASSIGN_ATHLETE': {
      const { athleteId, boatIndex, seatNumber } = action;
      const targetBoat = state.boats[boatIndex];
      if (!targetBoat) return state;

      // Remove athlete from current location (if any)
      let boats = removeAthleteFromBoats(state.boats, athleteId);
      let unassigned = state.unassigned.filter((id) => id !== athleteId);

      // Check if target seat is occupied
      const occupant = targetBoat.seats.find((s) => s.seatNumber === seatNumber)?.athleteId;
      if (occupant) {
        // Move occupant to unassigned
        unassigned = [...unassigned, occupant];
        boats = removeAthleteFromBoats(boats, occupant);
      }

      // Place athlete in target seat
      boats = boats.map((boat, bi) =>
        bi === boatIndex
          ? {
              ...boat,
              seats: boat.seats.map((seat) =>
                seat.seatNumber === seatNumber ? { ...seat, athleteId } : seat
              ),
            }
          : boat
      );

      return {
        ...state,
        boats,
        unassigned,
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // ASSIGN_COXSWAIN: place athlete as coxswain
    // -------------------------------------------------------------------
    case 'ASSIGN_COXSWAIN': {
      const { athleteId, boatIndex } = action;
      const targetBoat = state.boats[boatIndex];
      if (!targetBoat || !targetBoat.hasCoxswain) return state;

      // Remove athlete from current location
      let boats = removeAthleteFromBoats(state.boats, athleteId);
      let unassigned = state.unassigned.filter((id) => id !== athleteId);

      // If there's already a coxswain, move them to unassigned
      const currentCox = targetBoat.coxswainId;
      if (currentCox) {
        boats = removeAthleteFromBoats(boats, currentCox);
        unassigned = [...unassigned, currentCox];
      }

      // Place athlete as coxswain
      boats = boats.map((boat, bi) =>
        bi === boatIndex ? { ...boat, coxswainId: athleteId } : boat
      );

      return {
        ...state,
        boats,
        unassigned,
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // UNASSIGN_ATHLETE: remove from seat, add to unassigned
    // -------------------------------------------------------------------
    case 'UNASSIGN_ATHLETE': {
      const { athleteId } = action;
      const location = findAthlete(state.boats, athleteId);
      if (!location) return state;

      const boats = removeAthleteFromBoats(state.boats, athleteId);
      return {
        ...state,
        boats,
        unassigned: [...state.unassigned, athleteId],
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // SWAP_ATHLETES: swap two athletes (seat-to-seat, seat-to-unassigned)
    // -------------------------------------------------------------------
    case 'SWAP_ATHLETES': {
      const { sourceAthleteId, targetAthleteId } = action;
      const sourceLocation = findAthlete(state.boats, sourceAthleteId);
      const targetLocation = findAthlete(state.boats, targetAthleteId);

      // Both in boats: swap positions
      if (sourceLocation && targetLocation) {
        const boats = state.boats.map((boat) => {
          let updated = { ...boat, seats: [...boat.seats] };
          // Handle coxswain swaps
          if (updated.coxswainId === sourceAthleteId) {
            updated = { ...updated, coxswainId: targetAthleteId };
          } else if (updated.coxswainId === targetAthleteId) {
            updated = { ...updated, coxswainId: sourceAthleteId };
          }
          // Handle seat swaps
          updated.seats = updated.seats.map((seat) => {
            if (seat.athleteId === sourceAthleteId) {
              return { ...seat, athleteId: targetAthleteId };
            }
            if (seat.athleteId === targetAthleteId) {
              return { ...seat, athleteId: sourceAthleteId };
            }
            return seat;
          });
          return updated;
        });

        return {
          ...state,
          boats,
          isDirty: true,
          history: pushHistory(state),
        };
      }

      // Source in boat, target in unassigned (or vice versa)
      const inBoat = sourceLocation ? sourceAthleteId : targetAthleteId;
      const inPool = sourceLocation ? targetAthleteId : sourceAthleteId;
      const loc = sourceLocation || targetLocation;
      if (!loc) return state;

      let boats = removeAthleteFromBoats(state.boats, inBoat);
      // Place pool athlete into the boat location
      if (loc.seatNumber === 0) {
        // Coxswain position
        boats = boats.map((boat, bi) =>
          bi === loc.boatIndex ? { ...boat, coxswainId: inPool } : boat
        );
      } else {
        boats = boats.map((boat, bi) =>
          bi === loc.boatIndex
            ? {
                ...boat,
                seats: boat.seats.map((seat) =>
                  seat.seatNumber === loc.seatNumber ? { ...seat, athleteId: inPool } : seat
                ),
              }
            : boat
        );
      }

      const unassigned = state.unassigned.filter((id) => id !== inPool).concat(inBoat);

      return {
        ...state,
        boats,
        unassigned,
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // MOVE_ATHLETE: Pragmatic DnD drop handler
    // Places athlete in target seat. If target is occupied, displaced
    // athlete goes to unassigned (not swapped -- SWAP is explicit).
    // -------------------------------------------------------------------
    case 'MOVE_ATHLETE': {
      const { athleteId, targetBoatIndex, targetSeatNumber } = action;
      const targetBoat = state.boats[targetBoatIndex];
      if (!targetBoat) return state;

      // Remove athlete from wherever they are
      let boats = removeAthleteFromBoats(state.boats, athleteId);
      let unassigned = state.unassigned.filter((id) => id !== athleteId);

      if (targetSeatNumber === 0) {
        // Coxswain position
        if (!targetBoat.hasCoxswain) return state;
        const currentCox = targetBoat.coxswainId;
        if (currentCox && currentCox !== athleteId) {
          boats = removeAthleteFromBoats(boats, currentCox);
          unassigned = [...unassigned, currentCox];
        }
        boats = boats.map((boat, bi) =>
          bi === targetBoatIndex ? { ...boat, coxswainId: athleteId } : boat
        );
      } else {
        // Regular seat
        const occupant = targetBoat.seats.find((s) => s.seatNumber === targetSeatNumber)?.athleteId;
        if (occupant && occupant !== athleteId) {
          boats = removeAthleteFromBoats(boats, occupant);
          unassigned = [...unassigned, occupant];
        }
        boats = boats.map((boat, bi) =>
          bi === targetBoatIndex
            ? {
                ...boat,
                seats: boat.seats.map((seat) =>
                  seat.seatNumber === targetSeatNumber ? { ...seat, athleteId } : seat
                ),
              }
            : boat
        );
      }

      return {
        ...state,
        boats,
        unassigned,
        isDirty: true,
        history: pushHistory(state),
      };
    }

    // -------------------------------------------------------------------
    // SELECT_ATHLETE: for mobile tap-select mode (no history push)
    // -------------------------------------------------------------------
    case 'SELECT_ATHLETE':
      return {
        ...state,
        selectedAthleteId: action.athleteId,
      };

    // -------------------------------------------------------------------
    // LOAD_LINEUP: initialize from server data (no history push)
    // -------------------------------------------------------------------
    case 'LOAD_LINEUP': {
      const { lineup, allAthleteIds } = action;
      const boats = assignmentsToBoats(lineup.assignments);
      const assignedIds = new Set<string>();
      for (const boat of boats) {
        if (boat.coxswainId) assignedIds.add(boat.coxswainId);
        for (const seat of boat.seats) {
          if (seat.athleteId) assignedIds.add(seat.athleteId);
        }
      }
      const unassigned = allAthleteIds.filter((id) => !assignedIds.has(id));

      return {
        boats,
        unassigned,
        selectedAthleteId: null,
        isDirty: false,
        history: { past: [], future: [] },
      };
    }

    // -------------------------------------------------------------------
    // CLEAR: reset to empty
    // -------------------------------------------------------------------
    case 'CLEAR':
      return {
        ...createInitialState(),
        isDirty: state.boats.length > 0,
        history: pushHistory(state),
      };

    // -------------------------------------------------------------------
    // UNDO / REDO
    // -------------------------------------------------------------------
    case 'UNDO': {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1]!;
      return {
        boats: previous.boats,
        unassigned: previous.unassigned,
        selectedAthleteId: previous.selectedAthleteId,
        isDirty: true,
        history: {
          past: state.history.past.slice(0, -1),
          future: [snapshot(state), ...state.history.future],
        },
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0]!;
      return {
        boats: next.boats,
        unassigned: next.unassigned,
        selectedAthleteId: next.selectedAthleteId,
        isDirty: true,
        history: {
          past: [...state.history.past, snapshot(state)],
          future: state.history.future.slice(1),
        },
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Convert server assignments to boats array
// ---------------------------------------------------------------------------

function assignmentsToBoats(assignments: LineupAssignment[]): LineupBoat[] {
  // Group assignments by boatClass + shellName
  const boatMap = new Map<string, LineupAssignment[]>();
  for (const a of assignments) {
    const key = `${a.boatClass}::${a.shellName || ''}`;
    const group = boatMap.get(key) || [];
    group.push(a);
    boatMap.set(key, group);
  }

  const boats: LineupBoat[] = [];
  for (const [key, group] of boatMap) {
    const [boatClassStr, shellName] = key.split('::');
    const boatClass = boatClassStr as BoatClass;
    const seatCount = BOAT_SEAT_COUNTS[boatClass] ?? group.length;
    const hasCoxswain = BOAT_HAS_COXSWAIN[boatClass] ?? false;

    // Create empty boat
    const boat: LineupBoat = {
      boatClass,
      shellName: shellName || undefined,
      seatCount,
      hasCoxswain,
      coxswainId: null,
      seats: Array.from({ length: seatCount }, (_, i) => ({
        seatNumber: i + 1,
        athleteId: null,
        side: 'Starboard' as Side,
      })),
    };

    // Fill seats from assignments
    for (const a of group) {
      if (a.isCoxswain) {
        boat.coxswainId = a.athleteId;
      } else {
        const seat = boat.seats.find((s) => s.seatNumber === a.seatNumber);
        if (seat) {
          seat.athleteId = a.athleteId;
          seat.side = a.side;
        }
      }
    }

    boats.push(boat);
  }

  return boats;
}

// ---------------------------------------------------------------------------
// Convert boats array back to server assignments
// ---------------------------------------------------------------------------

function boatsToAssignments(boats: LineupBoat[]): LineupAssignment[] {
  const assignments: LineupAssignment[] = [];

  for (const boat of boats) {
    // Coxswain assignment
    if (boat.coxswainId && boat.hasCoxswain) {
      assignments.push({
        athleteId: boat.coxswainId,
        boatClass: boat.boatClass,
        shellName: boat.shellName || null,
        seatNumber: 0,
        side: 'Port',
        isCoxswain: true,
      });
    }

    // Seat assignments
    for (const seat of boat.seats) {
      if (seat.athleteId) {
        assignments.push({
          athleteId: seat.athleteId,
          boatClass: boat.boatClass,
          shellName: boat.shellName || null,
          seatNumber: seat.seatNumber,
          side: seat.side,
          isCoxswain: false,
        });
      }
    }
  }

  return assignments;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLineupState() {
  const [state, dispatch] = useReducer(lineupReducer, undefined, createInitialState);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const toAssignments = useCallback((): LineupAssignment[] => {
    return boatsToAssignments(state.boats);
  }, [state.boats]);

  return useMemo(
    () => ({
      state: {
        boats: state.boats,
        unassigned: state.unassigned,
        selectedAthleteId: state.selectedAthleteId,
        isDirty: state.isDirty,
      } satisfies LineupState,
      dispatch,
      canUndo,
      canRedo,
      toAssignments,
    }),
    [
      state.boats,
      state.unassigned,
      state.selectedAthleteId,
      state.isDirty,
      canUndo,
      canRedo,
      toAssignments,
      dispatch,
    ]
  );
}
