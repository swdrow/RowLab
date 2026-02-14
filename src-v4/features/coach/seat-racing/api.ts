/**
 * Seat Racing API functions and query option factories.
 *
 * Uses /api/v1/seat-races and /api/v1/ratings endpoints (existing backend).
 * Query keys are team-scoped for cache isolation on team switch.
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AthleteRating,
  SeatRaceSession,
  SessionDetail,
  CreateSessionInput,
  Side,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const seatRacingKeys = {
  all: (teamId: string) => ['seatRacing', teamId] as const,
  ratings: (teamId: string, side?: Side | null) =>
    ['seatRacing', teamId, 'ratings', side ?? 'all'] as const,
  sessions: (teamId: string) => ['seatRacing', teamId, 'sessions'] as const,
  sessionDetail: (teamId: string, sessionId: string) =>
    ['seatRacing', teamId, 'session', sessionId] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

async function fetchRatings(teamId: string, side?: Side | null): Promise<AthleteRating[]> {
  const params: Record<string, string> = { teamId, type: 'seat_race_elo' };
  if (side) params.side = side;

  const res = await api.get('/api/v1/ratings', { params });
  return res.data.data.ratings as AthleteRating[];
}

async function fetchSessions(teamId: string): Promise<SeatRaceSession[]> {
  const res = await api.get('/api/v1/seat-races', {
    params: { teamId },
  });
  return res.data.data.sessions as SeatRaceSession[];
}

async function fetchSessionDetail(_teamId: string, sessionId: string): Promise<SessionDetail> {
  const res = await api.get(`/api/v1/seat-races/${sessionId}`);
  return res.data.data.session as SessionDetail;
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

async function createSession(input: CreateSessionInput): Promise<SeatRaceSession> {
  const res = await api.post('/api/v1/seat-races', input);
  return res.data.data.session as SeatRaceSession;
}

async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/api/v1/seat-races/${sessionId}`);
}

async function recalculateRatings(teamId: string): Promise<{ updated: number }> {
  const res = await api.post('/api/v1/ratings/recalculate', { teamId });
  return res.data.data as { updated: number };
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function ratingsOptions(teamId: string, side?: Side | null) {
  return queryOptions<AthleteRating[]>({
    queryKey: seatRacingKeys.ratings(teamId, side),
    queryFn: () => fetchRatings(teamId, side),
    staleTime: 300_000, // 5 min
    enabled: !!teamId,
  });
}

export function sessionsOptions(teamId: string) {
  return queryOptions<SeatRaceSession[]>({
    queryKey: seatRacingKeys.sessions(teamId),
    queryFn: () => fetchSessions(teamId),
    staleTime: 120_000,
    enabled: !!teamId,
  });
}

export function sessionDetailOptions(teamId: string, sessionId: string) {
  return queryOptions<SessionDetail>({
    queryKey: seatRacingKeys.sessionDetail(teamId, sessionId),
    queryFn: () => fetchSessionDetail(teamId, sessionId),
    staleTime: 120_000,
    enabled: !!teamId && !!sessionId,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Recalculate all ELO ratings from scratch.
 * Invalidates all rating queries on success.
 */
export function useRecalculate(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recalculateRatings(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seatRacingKeys.all(teamId) });
    },
  });
}

/**
 * Create a new seat race session.
 * Invalidates sessions list on success.
 */
export function useCreateSession(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seatRacingKeys.sessions(teamId) });
    },
  });
}

/**
 * Delete a seat race session.
 * Invalidates sessions list on success.
 */
export function useDeleteSession(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seatRacingKeys.sessions(teamId) });
    },
  });
}
