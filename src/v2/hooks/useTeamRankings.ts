import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type {
  TeamSpeedEstimate,
  HeadToHeadComparison,
  ExternalRanking,
  ExternalRankingFormData,
  ExternalTeam,
} from '../types/regatta';

const API_URL = import.meta.env.VITE_API_URL || '';

export const rankingKeys = {
  all: ['rankings'] as const,
  boatClasses: () => [...rankingKeys.all, 'boatClasses'] as const,
  boatClass: (boatClass: string, season?: string) =>
    [...rankingKeys.all, 'boatClass', boatClass, season] as const,
  headToHead: (opponent: string, boatClass: string) =>
    [...rankingKeys.all, 'h2h', opponent, boatClass] as const,
  external: (filters?: { boatClass?: string; source?: string }) =>
    [...rankingKeys.all, 'external', filters] as const,
  externalTeams: () => [...rankingKeys.all, 'externalTeams'] as const,
};

// API Functions
async function fetchBoatClasses(token: string, season?: string): Promise<string[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/v1/team-rankings/boat-classes${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch boat classes');
  const data = await res.json();
  return data.data.boatClasses;
}

async function fetchBoatClassRankings(
  token: string,
  boatClass: string,
  season?: string
): Promise<Array<TeamSpeedEstimate & { teamName: string; rank: number }>> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/v1/team-rankings/rankings/${boatClass}${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch rankings');
  const data = await res.json();
  return data.data.rankings;
}

async function fetchHeadToHead(
  token: string,
  opponent: string,
  boatClass: string,
  season?: string
): Promise<HeadToHeadComparison> {
  const params = new URLSearchParams({ opponent, boatClass });
  if (season) params.append('season', season);
  const res = await fetch(`${API_URL}/api/v1/team-rankings/head-to-head?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch head-to-head');
  const data = await res.json();
  return data.data.comparison;
}

async function fetchExternalTeams(token: string): Promise<ExternalTeam[]> {
  const res = await fetch(`${API_URL}/api/v1/external-teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch external teams');
  const data = await res.json();
  return data.data.teams;
}

async function fetchExternalRankings(
  token: string,
  filters?: { boatClass?: string; source?: string; season?: string }
): Promise<ExternalRanking[]> {
  const params = new URLSearchParams();
  if (filters?.boatClass) params.append('boatClass', filters.boatClass);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.season) params.append('season', filters.season);

  const url = `${API_URL}/api/v1/regattas/rankings/external${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch external rankings');
  const data = await res.json();
  return data.data.rankings;
}

async function addExternalRanking(
  token: string,
  ranking: ExternalRankingFormData
): Promise<ExternalRanking> {
  const res = await fetch(`${API_URL}/api/v1/regattas/rankings/external`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ranking),
  });
  if (!res.ok) throw new Error('Failed to add external ranking');
  const data = await res.json();
  return data.data.ranking;
}

async function deleteExternalRanking(token: string, rankingId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/regattas/rankings/external/${rankingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete external ranking');
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch available boat classes with race data
 */
export function useBoatClasses(season?: string) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: rankingKeys.boatClasses(),
    queryFn: () => fetchBoatClasses(accessToken!, season),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch rankings for a specific boat class
 */
export function useBoatClassRankings(boatClass: string | undefined, season?: string) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: rankingKeys.boatClass(boatClass!, season),
    queryFn: () => fetchBoatClassRankings(accessToken!, boatClass!, season),
    enabled: !!accessToken && !!boatClass,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch head-to-head comparison with an opponent
 */
export function useHeadToHead(
  opponent: string | undefined,
  boatClass: string | undefined,
  season?: string
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: rankingKeys.headToHead(opponent!, boatClass!),
    queryFn: () => fetchHeadToHead(accessToken!, opponent!, boatClass!, season),
    enabled: !!accessToken && !!opponent && !!boatClass,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch list of external teams
 */
export function useExternalTeams() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: rankingKeys.externalTeams(),
    queryFn: () => fetchExternalTeams(accessToken!),
    enabled: !!accessToken,
    staleTime: 30 * 60 * 1000, // External teams rarely change
  });
}

/**
 * Fetch external rankings with optional filters
 */
export function useExternalRankings(filters?: {
  boatClass?: string;
  source?: string;
  season?: string;
}) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: rankingKeys.external(filters),
    queryFn: () => fetchExternalRankings(accessToken!, filters),
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Add an external ranking
 */
export function useAddExternalRanking() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ranking: ExternalRankingFormData) => addExternalRanking(accessToken!, ranking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.external() });
    },
  });
}

/**
 * Delete an external ranking
 */
export function useDeleteExternalRanking() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rankingId: string) => deleteExternalRanking(accessToken!, rankingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.external() });
    },
  });
}

/**
 * Trigger team speed calculation
 */
export function useCalculateTeamSpeed() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boatClass, season }: { boatClass: string; season?: string }) => {
      const res = await fetch(`${API_URL}/api/v1/team-rankings/calculate/${boatClass}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ season }),
      });
      if (!res.ok) throw new Error('Failed to calculate speed');
      const data = await res.json();
      return data.data.estimate as TeamSpeedEstimate;
    },
    onSuccess: (_, { boatClass, season }) => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.boatClass(boatClass, season) });
    },
  });
}
