// src/v2/types/activity.ts
// TypeScript types for unified activity feed with infinite scroll

// ============================================
// ACTIVITY TYPES
// ============================================

export type ActivityType =
  | 'erg_test'
  | 'session_participation'
  | 'race_result'
  | 'attendance'
  | 'seat_race'
  | 'lineup_assignment';

// ============================================
// BASE ACTIVITY
// ============================================

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: string;
  athleteId: string;
  athleteName?: string;
  metadata: Record<string, unknown>;
}

// ============================================
// SPECIFIC ACTIVITY TYPES
// ============================================

export interface ErgTestActivity extends Activity {
  type: 'erg_test';
  metadata: {
    testType: string; // '2k', '6k', etc.
    time: number; // seconds
    distance: number;
    watts?: number;
    personalBest?: boolean;
  };
}

export interface SessionParticipationActivity extends Activity {
  type: 'session_participation';
  metadata: {
    sessionId: string;
    sessionType: string;
    sessionName: string;
    participationPercent: number;
  };
}

export interface RaceResultActivity extends Activity {
  type: 'race_result';
  metadata: {
    regattaName: string;
    eventName: string;
    boatClass: string;
    place: number;
    time?: number;
    margin?: string;
  };
}

export interface AttendanceActivity extends Activity {
  type: 'attendance';
  metadata: {
    status: string;
    practiceType?: string;
  };
}

export interface SeatRaceActivity extends Activity {
  type: 'seat_race';
  metadata: {
    sessionId: string;
    ratingChange?: number;
    newRating?: number;
  };
}

export interface LineupAssignmentActivity extends Activity {
  type: 'lineup_assignment';
  metadata: {
    lineupName: string;
    boatClass: string;
    seatNumber?: number;
  };
}

// ============================================
// UNION TYPE
// ============================================

export type AnyActivity =
  | ErgTestActivity
  | SessionParticipationActivity
  | RaceResultActivity
  | AttendanceActivity
  | SeatRaceActivity
  | LineupAssignmentActivity;

// ============================================
// PAGINATION RESPONSE
// ============================================

export interface ActivityFeedResponse {
  items: AnyActivity[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================
// DISPLAY CONSTANTS
// ============================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  erg_test: 'Erg Test',
  session_participation: 'Session',
  race_result: 'Race Result',
  attendance: 'Attendance',
  seat_race: 'Seat Race',
  lineup_assignment: 'Lineup',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  erg_test: 'bg-blue-500/10 text-blue-500',
  session_participation: 'bg-green-500/10 text-green-500',
  race_result: 'bg-amber-500/10 text-amber-500',
  attendance: 'bg-violet-500/10 text-violet-500',
  seat_race: 'bg-orange-500/10 text-orange-500',
  lineup_assignment: 'bg-pink-500/10 text-pink-500',
};
