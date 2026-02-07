import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type {
  Event,
  EventFormData,
  Race,
  RaceFormData,
  RaceResult,
  RaceResultFormData,
} from '../types/regatta';
import { queryKeys } from '../lib/queryKeys';

const API_URL = import.meta.env.VITE_API_URL || '';

// Query keys

// ============================================
// Event API Functions
// ============================================

async function createEvent(token: string, regattaId: string, event: EventFormData): Promise<Event> {
  const res = await fetch(`${API_URL}/api/v1/regattas/${regattaId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create event');
  }
  const data = await res.json();
  return data.data.event;
}

async function updateEvent(
  token: string,
  eventId: string,
  updates: Partial<EventFormData>
): Promise<Event> {
  const res = await fetch(`${API_URL}/api/v1/regattas/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error('Failed to update event');
  const data = await res.json();
  return data.data.event;
}

async function deleteEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/regattas/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to delete event');
}

// ============================================
// Race API Functions
// ============================================

async function createRace(token: string, eventId: string, race: RaceFormData): Promise<Race> {
  const res = await fetch(`${API_URL}/api/v1/regattas/events/${eventId}/races`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(race),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create race');
  }
  const data = await res.json();
  return data.data.race;
}

async function updateRace(
  token: string,
  raceId: string,
  updates: Partial<RaceFormData>
): Promise<Race> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error('Failed to update race');
  const data = await res.json();
  return data.data.race;
}

async function deleteRace(token: string, raceId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to delete race');
}

// ============================================
// Result API Functions
// ============================================

async function addResult(
  token: string,
  raceId: string,
  result: RaceResultFormData
): Promise<RaceResult> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(result),
  });

  if (!res.ok) throw new Error('Failed to add result');
  const data = await res.json();
  return data.data.result;
}

async function batchAddResults(
  token: string,
  raceId: string,
  results: RaceResultFormData[]
): Promise<RaceResult[]> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}/results/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ results }),
  });

  if (!res.ok) throw new Error('Failed to add results');
  const data = await res.json();
  return data.data.results;
}

async function updateResult(
  token: string,
  resultId: string,
  updates: Partial<RaceResultFormData>
): Promise<RaceResult> {
  const res = await fetch(`${API_URL}/api/v1/regattas/results/${resultId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error('Failed to update result');
  const data = await res.json();
  return data.data.result;
}

// ============================================
// Event Hooks
// ============================================

export function useCreateEvent() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ regattaId, event }: { regattaId: string; event: EventFormData }) => {
      if (!accessToken) throw new Error('Authentication required');
      return createEvent(accessToken, regattaId, event);
    },
    onSuccess: (_, { regattaId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.detail(regattaId) });
    },
  });
}

export function useUpdateEvent() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, updates }: { eventId: string; updates: Partial<EventFormData> }) =>
      updateEvent(accessToken!, eventId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

export function useDeleteEvent() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEvent(accessToken!, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

// ============================================
// Race Hooks
// ============================================

export function useCreateRace() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, race }: { eventId: string; race: RaceFormData }) =>
      createRace(accessToken!, eventId, race),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

export function useUpdateRace() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, updates }: { raceId: string; updates: Partial<RaceFormData> }) =>
      updateRace(accessToken!, raceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

export function useDeleteRace() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => deleteRace(accessToken!, raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

// ============================================
// Result Hooks
// ============================================

export function useAddResult() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, result }: { raceId: string; result: RaceResultFormData }) =>
      addResult(accessToken!, raceId, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

export function useBatchAddResults() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, results }: { raceId: string; results: RaceResultFormData[] }) =>
      batchAddResults(accessToken!, raceId, results),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}

export function useUpdateResult() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resultId,
      updates,
    }: {
      resultId: string;
      updates: Partial<RaceResultFormData>;
    }) => updateResult(accessToken!, resultId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all });
    },
  });
}
