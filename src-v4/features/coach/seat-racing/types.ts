/**
 * Seat Racing feature types.
 *
 * Mirrors backend API response shapes from /api/v1/seat-races
 * and /api/v1/ratings endpoints. Confidence thresholds match
 * the v2 seatRacing types for consistency.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Side = 'Port' | 'Starboard' | 'Cox';

export type Conditions = 'calm' | 'variable' | 'rough';

export type Direction = 'upstream' | 'downstream';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'PROVISIONAL';

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export interface AthleteRating {
  id: string;
  athleteId: string;
  teamId: string;
  ratingType: string; // 'seat_race_elo'
  ratingValue: number;
  confidenceScore: number | null; // 0-1
  racesCount: number;
  lastCalculatedAt: string;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    side: string | null;
  };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface SeatRaceSession {
  id: string;
  teamId: string;
  date: string; // ISO date string
  location: string | null;
  conditions: Conditions | null;
  boatClass: string; // '8+', '4+', '4-', '2-'
  description: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pieces & boats
// ---------------------------------------------------------------------------

export interface SeatRacePiece {
  id: string;
  sessionId: string;
  sequenceOrder: number;
  distanceMeters: number | null;
  direction: Direction | null;
  notes: string | null;
}

export interface SeatRaceBoat {
  id: string;
  pieceId: string;
  name: string;
  shellName: string | null;
  finishTimeSeconds: number | null;
  handicapSeconds: number;
}

export interface SeatRaceAssignment {
  id: string;
  boatId: string;
  athleteId: string;
  seatNumber: number; // 1=Bow, 8=Stroke, 9=Cox
  side: Side;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    side: string | null;
  };
}

// ---------------------------------------------------------------------------
// Session detail (nested)
// ---------------------------------------------------------------------------

export interface SessionDetail extends SeatRaceSession {
  pieces: Array<
    SeatRacePiece & {
      boats: Array<
        SeatRaceBoat & {
          assignments: SeatRaceAssignment[];
        }
      >;
    }
  >;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  date: string;
  location?: string | null;
  conditions?: Conditions | null;
  boatClass: string;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Maps a confidence score (0-1) to a named confidence level.
 * Thresholds: HIGH >= 0.8, MEDIUM >= 0.5, LOW >= 0.3, PROVISIONAL < 0.3
 */
export function getConfidenceLevel(score: number | null): ConfidenceLevel {
  if (score == null) return 'PROVISIONAL';
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  if (score >= 0.3) return 'LOW';
  return 'PROVISIONAL';
}

/** Display config for confidence badge colors (Tailwind v4 + CSS var tokens) */
export const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; color: string; bgColor: string }
> = {
  HIGH: {
    label: 'High',
    color: 'text-data-excellent',
    bgColor: 'bg-data-excellent/15',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-data-good',
    bgColor: 'bg-data-good/15',
  },
  LOW: {
    label: 'Low',
    color: 'text-data-warning',
    bgColor: 'bg-data-warning/15',
  },
  PROVISIONAL: {
    label: 'Provisional',
    color: 'text-data-poor',
    bgColor: 'bg-data-poor/15',
  },
};

/**
 * Get the CSS var token color for a given ELO rating value.
 * >= 1200: excellent, >= 1000: good, >= 800: warning, < 800: poor
 */
export function getRatingColor(rating: number): string {
  if (rating >= 1200) return 'var(--color-data-excellent)';
  if (rating >= 1000) return 'var(--color-data-good)';
  if (rating >= 800) return 'var(--color-data-warning)';
  return 'var(--color-data-poor)';
}

/** Tailwind text color class for a rating value */
export function getRatingTextClass(rating: number): string {
  if (rating >= 1200) return 'text-data-excellent';
  if (rating >= 1000) return 'text-data-good';
  if (rating >= 800) return 'text-data-warning';
  return 'text-data-poor';
}
