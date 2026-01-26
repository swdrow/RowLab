// src/v2/types/session.ts
// TypeScript types for Training Sessions (Live Erg, Water Practice, etc.)

// ============================================
// ENUMS / LITERAL TYPES
// ============================================

export type SessionType = 'ERG' | 'ROW' | 'LIFT' | 'RUN' | 'CROSS_TRAIN' | 'RECOVERY';
export type SessionStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PieceSegment = 'WARMUP' | 'MAIN' | 'COOLDOWN';

// ============================================
// PIECE (Workout segment within a session)
// ============================================

export interface Piece {
  id: string;
  sessionId: string;
  segment: PieceSegment;
  name: string;
  description?: string;
  order: number;
  distance?: number; // meters
  duration?: number; // seconds
  targetSplit?: number; // seconds per 500m
  targetRate?: number; // strokes per minute
  targetWatts?: number;
  targetHRZone?: string;
  targetRPE?: number; // 1-10 scale
  notes?: string;
  boatClass?: string; // For on-water sessions
  sets?: number;
  reps?: number;
}

// ============================================
// SESSION
// ============================================

export interface Session {
  id: string;
  name: string;
  type: SessionType;
  date: string; // ISO date string
  startTime?: string; // HH:mm format
  endTime?: string;
  recurrenceRule?: string; // RRULE format for recurring sessions
  notes?: string;
  status: SessionStatus;
  teamId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  pieces: Piece[];
  sessionCode?: string; // For live session joining
  athleteVisibility: boolean; // Whether athletes can see this session
}

// ============================================
// FORM / INPUT TYPES
// ============================================

export interface CreateSessionInput {
  name: string;
  type: SessionType;
  date: string;
  startTime?: string;
  endTime?: string;
  recurrenceRule?: string;
  notes?: string;
  pieces: Omit<Piece, 'id' | 'sessionId'>[];
  athleteVisibility?: boolean;
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {
  status?: SessionStatus;
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

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

export interface SessionResponse {
  session: Session;
}

export interface SessionFilters {
  type?: SessionType;
  status?: SessionStatus;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

// ============================================
// LIVE SESSION TYPES
// ============================================

export interface LiveSessionState {
  sessionId: string;
  status: 'waiting' | 'countdown' | 'active' | 'paused' | 'finished';
  currentPieceIndex: number;
  elapsedTime: number; // seconds
  participants: LiveParticipant[];
}

export interface LiveParticipant {
  athleteId: string;
  athleteName: string;
  joinedAt: string;
  isConnected: boolean;
  currentData?: LiveErgData;
}

export interface LiveErgData {
  distance: number;
  time: number;
  pace: number; // seconds per 500m
  strokeRate: number;
  watts: number;
  heartRate?: number;
  timestamp: string;
}

// ============================================
// SESSION CALENDAR TYPES
// ============================================

export interface SessionCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    sessionId: string;
    type: SessionType;
    status: SessionStatus;
    isRecurring: boolean;
    parentId?: string; // Original session ID if this is a recurrence instance
  };
}
