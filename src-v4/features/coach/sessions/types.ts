/**
 * Training Session types for coach session CRUD.
 *
 * Mirrors backend Prisma Session + Piece models.
 * Status flow: PLANNED -> ACTIVE -> COMPLETED (or CANCELLED at any point).
 */

// ---------------------------------------------------------------------------
// Enums / literal types
// ---------------------------------------------------------------------------

export type SessionType = 'ERG' | 'ROW' | 'LIFT' | 'RUN' | 'CROSS_TRAIN' | 'RECOVERY';
export type SessionStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PieceSegment = 'WARMUP' | 'MAIN' | 'COOLDOWN';

// ---------------------------------------------------------------------------
// Domain models
// ---------------------------------------------------------------------------

export interface SessionPiece {
  id: string;
  sessionId: string;
  segment: PieceSegment;
  name: string;
  description?: string | null;
  order: number;
  distance?: number | null;
  duration?: number | null;
  targetSplit?: number | null;
  targetRate?: number | null;
  targetWatts?: number | null;
  targetHRZone?: string | null;
  targetRPE?: number | null;
  notes?: string | null;
  boatClass?: string | null;
  sets?: number | null;
  reps?: number | null;
}

export interface TrainingSession {
  id: string;
  name: string;
  type: SessionType;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  recurrenceRule?: string | null;
  notes?: string | null;
  status: SessionStatus;
  teamId: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  pieces: SessionPiece[];
  sessionCode?: string | null;
  athleteVisibility: boolean;
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface SessionsResponse {
  sessions: TrainingSession[];
}

// ---------------------------------------------------------------------------
// Input types (create / update)
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  name: string;
  type: SessionType;
  date: string;
  startTime?: string;
  endTime?: string;
  recurrenceRule?: string;
  notes?: string;
  athleteVisibility?: boolean;
  pieces?: CreatePieceInput[];
}

export interface UpdateSessionInput {
  name?: string;
  type?: SessionType;
  date?: string;
  startTime?: string;
  endTime?: string;
  recurrenceRule?: string;
  notes?: string;
  status?: SessionStatus;
  athleteVisibility?: boolean;
}

export interface CreatePieceInput {
  segment: PieceSegment;
  name: string;
  description?: string;
  order: number;
  distance?: number;
  duration?: number;
  targetSplit?: number;
  targetRate?: number;
  targetWatts?: number;
  targetHRZone?: string;
  targetRPE?: number;
  notes?: string;
  boatClass?: string;
  sets?: number;
  reps?: number;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface SessionFilters {
  type?: SessionType;
  status?: SessionStatus;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Display config
// ---------------------------------------------------------------------------

export const SESSION_TYPE_CONFIG: Record<
  SessionType,
  { label: string; color: string; defaultDuration: number }
> = {
  ERG: { label: 'Erg', color: 'text-data-excellent', defaultDuration: 60 },
  ROW: { label: 'On Water', color: 'text-accent-teal-primary', defaultDuration: 90 },
  LIFT: { label: 'Lift', color: 'text-data-warning', defaultDuration: 45 },
  RUN: { label: 'Run', color: 'text-data-warning', defaultDuration: 45 },
  CROSS_TRAIN: { label: 'Cross-Train', color: 'text-accent-teal-primary', defaultDuration: 45 },
  RECOVERY: { label: 'Recovery', color: 'text-data-excellent', defaultDuration: 30 },
};

export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; bgColor: string }
> = {
  PLANNED: {
    label: 'Draft',
    color: 'text-text-dim',
    bgColor: 'bg-void-deep',
  },
  ACTIVE: {
    label: 'Active',
    color: 'text-data-excellent',
    bgColor: 'bg-data-excellent/20',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-text-faint',
    bgColor: 'bg-void-deep/60',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-data-poor',
    bgColor: 'bg-data-poor/20',
  },
};

export const SEGMENT_ORDER: PieceSegment[] = ['WARMUP', 'MAIN', 'COOLDOWN'];
export const SEGMENT_LABELS: Record<PieceSegment, string> = {
  WARMUP: 'Warmup',
  MAIN: 'Main Set',
  COOLDOWN: 'Cooldown',
};
