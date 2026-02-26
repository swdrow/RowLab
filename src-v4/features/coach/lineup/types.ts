/**
 * Lineup Builder types.
 *
 * These mirror the backend lineup/assignment schema (server/routes/v1/lineups.js).
 * BoatClass uses display notation (8+, 4x, 1x) matching what coaches expect.
 * LineupBoat is the local editing shape -- boats with seat arrays for drag-drop.
 */

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

/** Standard rowing boat classes in display notation */
export type BoatClass = '8+' | '4+' | '4x' | '2x' | '1x' | '4-' | '2-' | 'pair';

/** Rowing side for sweep boats */
export type Side = 'Port' | 'Starboard';

/** Lineup lifecycle status */
export type LineupStatus = 'draft' | 'published';

// ---------------------------------------------------------------------------
// Boat configuration
// ---------------------------------------------------------------------------

/** Seat counts for each boat class */
export const BOAT_SEAT_COUNTS: Record<BoatClass, number> = {
  '8+': 8,
  '4+': 4,
  '4x': 4,
  '2x': 2,
  '1x': 1,
  '4-': 4,
  '2-': 2,
  pair: 2,
};

/** Whether a boat class has a coxswain */
export const BOAT_HAS_COXSWAIN: Record<BoatClass, boolean> = {
  '8+': true,
  '4+': true,
  '4x': false,
  '2x': false,
  '1x': false,
  '4-': false,
  '2-': false,
  pair: false,
};

/** Static boat configuration (no athlete assignment data) */
export interface BoatConfig {
  boatClass: BoatClass;
  shellName?: string;
  seatCount: number;
  hasCoxswain: boolean;
}

/** Single seat within a boat -- holds an optional athlete reference */
export interface BoatSeat {
  seatNumber: number;
  athleteId: string | null;
  side: Side;
}

/** A boat with its seat assignments -- the local editing shape */
export interface LineupBoat extends BoatConfig {
  seats: BoatSeat[];
  coxswainId: string | null;
}

// ---------------------------------------------------------------------------
// Server data shapes (match API response)
// ---------------------------------------------------------------------------

/** Single athlete assignment within a lineup (matches DB row) */
export interface LineupAssignment {
  athleteId: string;
  boatClass: string;
  shellName: string | null;
  seatNumber: number;
  side: Side;
  isCoxswain: boolean;
}

/** Full lineup as returned by GET /api/v1/lineups/:id */
export interface Lineup {
  id: string;
  name: string;
  notes?: string;
  status: LineupStatus;
  draftedBy?: string | null;
  draftedByUser?: { id: string; name: string };
  publishedAt?: string | null;
  assignments: LineupAssignment[];
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

/** Input for creating a new lineup */
export interface SaveLineupInput {
  name: string;
  notes?: string;
  assignments: LineupAssignment[];
}

/** Input for updating an existing lineup */
export interface UpdateLineupInput {
  name?: string;
  notes?: string;
  assignments?: LineupAssignment[];
}

/** Input for duplicating a lineup */
export interface DuplicateLineupInput {
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh LineupBoat from a BoatConfig with empty seats */
export function createEmptyBoat(boatClass: BoatClass, shellName?: string): LineupBoat {
  const seatCount = BOAT_SEAT_COUNTS[boatClass];
  const hasCoxswain = BOAT_HAS_COXSWAIN[boatClass];

  return {
    boatClass,
    shellName,
    seatCount,
    hasCoxswain,
    coxswainId: null,
    seats: Array.from({ length: seatCount }, (_, i) => ({
      seatNumber: i + 1,
      athleteId: null,
      side: 'Starboard' as Side,
    })),
  };
}
