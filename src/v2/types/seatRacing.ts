/**
 * Seat Racing types and Zod schemas matching backend API
 */

import { z } from 'zod';
import type { ApiResponse } from './dashboard';

// ============================================
// ENUMS
// ============================================

/**
 * Water conditions during seat race
 */
export type Conditions = 'calm' | 'variable' | 'rough';

/**
 * Race direction
 */
export type Direction = 'upstream' | 'downstream';

/**
 * Athlete side preference
 */
export type Side = 'Port' | 'Starboard' | 'Cox';

/**
 * Confidence level tiers based on rating confidence score
 */
export type ConfidenceLevel = 'UNRATED' | 'PROVISIONAL' | 'LOW' | 'MEDIUM' | 'HIGH';

// ============================================
// CORE TYPES
// ============================================

/**
 * Seat race session metadata
 */
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

/**
 * Piece within a seat race session
 */
export interface SeatRacePiece {
  id: string;
  sessionId: string;
  sequenceOrder: number;
  distanceMeters: number | null;
  direction: Direction | null;
  notes: string | null;
}

/**
 * Boat within a piece
 */
export interface SeatRaceBoat {
  id: string;
  pieceId: string;
  name: string; // 'Boat A', 'Boat B'
  shellName: string | null;
  finishTimeSeconds: number | null;
  handicapSeconds: number; // Default 0
}

/**
 * Athlete assignment to a boat
 */
export interface SeatRaceAssignment {
  id: string;
  boatId: string;
  athleteId: string;
  seatNumber: number; // 1=Bow, 8=Stroke, 9=Cox
  side: Side;
}

/**
 * Athlete ELO rating
 */
export interface AthleteRating {
  id: string;
  athleteId: string;
  teamId: string;
  ratingType: string; // 'seat_race_elo', 'combined'
  ratingValue: number;
  confidenceScore: number | null; // 0-1
  racesCount: number;
  lastCalculatedAt: string;
}

/**
 * Session with nested pieces, boats, assignments for detail view
 */
export interface SessionWithDetails extends SeatRaceSession {
  pieces: Array<
    SeatRacePiece & {
      boats: Array<
        SeatRaceBoat & {
          assignments: Array<
            SeatRaceAssignment & {
              athlete: {
                id: string;
                firstName: string;
                lastName: string;
                side: string | null;
              };
            }
          >;
        }
      >;
    }
  >;
}

/**
 * Rating with athlete info for rankings table
 */
export interface RatingWithAthlete extends AthleteRating {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    side: string | null;
  };
}

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

/**
 * Session creation form validation
 */
export const sessionCreateSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  location: z.string().optional().nullable(),
  conditions: z.enum(['calm', 'variable', 'rough']).optional().nullable(),
  boatClass: z.string().min(1, 'Boat class is required'),
  description: z.string().optional().nullable(),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;

/**
 * Session update form validation
 */
export const sessionUpdateSchema = sessionCreateSchema.partial();

export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;

/**
 * Piece creation form validation
 */
export const pieceCreateSchema = z.object({
  sequenceOrder: z.number().int().positive(),
  distanceMeters: z.number().int().positive().optional().nullable(),
  direction: z.enum(['upstream', 'downstream']).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PieceCreateInput = z.infer<typeof pieceCreateSchema>;

/**
 * Piece update form validation
 */
export const pieceUpdateSchema = pieceCreateSchema.partial();

export type PieceUpdateInput = z.infer<typeof pieceUpdateSchema>;

/**
 * Boat creation form validation
 */
export const boatCreateSchema = z.object({
  name: z.string().min(1, 'Boat name is required'),
  shellName: z.string().optional().nullable(),
  finishTimeSeconds: z.number().positive().optional().nullable(),
  handicapSeconds: z.number().optional().default(0),
});

export type BoatCreateInput = z.infer<typeof boatCreateSchema>;

/**
 * Boat update form validation
 */
export const boatUpdateSchema = boatCreateSchema.partial();

export type BoatUpdateInput = z.infer<typeof boatUpdateSchema>;

/**
 * Assignment validation
 */
export const assignmentSchema = z.object({
  athleteId: z.string().uuid(),
  seatNumber: z.number().int().min(1).max(9),
  side: z.enum(['Port', 'Starboard', 'Cox']),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Maps confidence score (0-1) to confidence level tier
 */
export function getConfidenceLevel(score: number | null): ConfidenceLevel {
  if (score === null || score === undefined) return 'UNRATED';
  if (score < 0.2) return 'PROVISIONAL';
  if (score < 0.4) return 'LOW';
  if (score < 0.7) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Parses time string (MM:SS.s or seconds) to seconds
 * Examples: "6:23.4" -> 383.4, "383.4" -> 383.4
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;

  // If already a number, return it
  const asNumber = parseFloat(timeStr);
  if (!isNaN(asNumber) && !timeStr.includes(':')) {
    return asNumber;
  }

  // Parse MM:SS.s format
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  // Fallback
  return asNumber || 0;
}

/**
 * Formats seconds to MM:SS.s display format
 */
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '—';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const secondsFormatted = remainingSeconds.toFixed(1).padStart(4, '0');

  return `${minutes}:${secondsFormatted}`;
}

// Re-export for convenience
export type { ApiResponse };
