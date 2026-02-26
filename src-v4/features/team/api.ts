/**
 * Team API functions and query option factories.
 *
 * All query keys follow ['team', teamId, 'resource'] structure for
 * easy invalidation on team switch. API functions use the /api/u/teams
 * namespace under the unified auth router.
 */
import { infiniteQueryOptions, queryOptions, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  TeamDetail,
  TeamOverview,
  RosterMember,
  ActivityFeedPage,
  Announcement,
  InviteCode,
  CreateTeamInput,
  GenerateInviteCodeInput,
  UpdateTeamInput,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory (team-scoped)
// ---------------------------------------------------------------------------

export const teamKeys = {
  all: ['team'] as const,
  detail: (identifier: string) => ['team', 'detail', identifier] as const,
  overview: (teamId: string) => ['team', teamId, 'overview'] as const,
  roster: (teamId: string) => ['team', teamId, 'roster'] as const,
  activity: (teamId: string) => ['team', teamId, 'activity'] as const,
  announcements: (teamId: string) => ['team', teamId, 'announcements'] as const,
  inviteCodes: (teamId: string) => ['team', teamId, 'inviteCodes'] as const,
  slugCheck: (teamId: string, slug: string) => ['team', teamId, 'slugCheck', slug] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

export async function fetchTeamByIdentifier(identifier: string): Promise<TeamDetail> {
  const res = await api.get(`/api/u/teams/by-identifier/${encodeURIComponent(identifier)}`);
  return res.data.data.team as TeamDetail;
}

export async function fetchTeamOverview(teamId: string): Promise<TeamOverview> {
  const res = await api.get(`/api/u/teams/${teamId}/overview`);
  return res.data.data.overview as TeamOverview;
}

export async function fetchTeamRoster(teamId: string): Promise<RosterMember[]> {
  const res = await api.get(`/api/u/teams/${teamId}/roster`);
  return res.data.data.roster as RosterMember[];
}

export async function fetchTeamActivity(
  teamId: string,
  cursor?: string | null
): Promise<ActivityFeedPage> {
  const params: Record<string, string> = { limit: '20' };
  if (cursor) params.cursor = cursor;
  const res = await api.get(`/api/u/teams/${teamId}/activity`, { params });
  return res.data.data as ActivityFeedPage;
}

export async function fetchTeamAnnouncements(teamId: string): Promise<Announcement[]> {
  const res = await api.get(`/api/u/teams/${teamId}/announcements`);
  return res.data.data.announcements as Announcement[];
}

export async function fetchInviteCodes(teamId: string): Promise<InviteCode[]> {
  const res = await api.get(`/api/u/teams/${teamId}/invite-codes`);
  return res.data.data.inviteCodes as InviteCode[];
}

export async function checkSlugAvailability(
  teamId: string,
  slug: string
): Promise<{ available: boolean }> {
  const res = await api.get(`/api/u/teams/${teamId}/slug-check/${encodeURIComponent(slug)}`);
  return res.data.data as { available: boolean };
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

export async function createTeam(input: CreateTeamInput): Promise<TeamDetail> {
  const res = await api.post('/api/u/teams', input);
  return res.data.data.team as TeamDetail;
}

export async function joinTeamByCode(
  code: string
): Promise<{ team: TeamDetail; role: string; welcomeMessage?: string }> {
  const res = await api.post(`/api/u/teams/join/${encodeURIComponent(code)}`);
  return res.data.data as { team: TeamDetail; role: string; welcomeMessage?: string };
}

export async function leaveTeam(teamId: string): Promise<void> {
  await api.delete(`/api/u/teams/${teamId}/leave`);
}

export async function deleteTeam(teamId: string): Promise<void> {
  await api.delete(`/api/u/teams/${teamId}`);
}

export async function createAnnouncement(
  teamId: string,
  input: { title: string; content: string; isPinned?: boolean }
): Promise<Announcement> {
  const res = await api.post(`/api/u/teams/${teamId}/announcements`, input);
  return res.data.data.announcement as Announcement;
}

export async function generateInviteCode(
  teamId: string,
  input: GenerateInviteCodeInput
): Promise<InviteCode> {
  const res = await api.post(`/api/u/teams/${teamId}/invite-codes`, input);
  return res.data.data.inviteCode as InviteCode;
}

export async function revokeInviteCode(teamId: string, codeId: string): Promise<void> {
  await api.delete(`/api/u/teams/${teamId}/invite-codes/${codeId}`);
}

export async function updateTeamSettings(
  teamId: string,
  input: UpdateTeamInput
): Promise<TeamDetail> {
  const res = await api.patch(`/api/u/teams/${teamId}`, input);
  return res.data.data.team as TeamDetail;
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: string
): Promise<void> {
  await api.patch(`/api/u/teams/${teamId}/members/${userId}`, { role });
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/api/u/teams/${teamId}/members/${userId}`);
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function teamByIdentifierOptions(identifier: string) {
  return queryOptions<TeamDetail>({
    queryKey: teamKeys.detail(identifier),
    queryFn: () => fetchTeamByIdentifier(identifier),
    staleTime: 120_000,
    enabled: !!identifier,
  });
}

export function teamOverviewOptions(teamId: string) {
  return queryOptions<TeamOverview>({
    queryKey: teamKeys.overview(teamId),
    queryFn: () => fetchTeamOverview(teamId),
    staleTime: 120_000,
    enabled: !!teamId,
  });
}

export function teamRosterOptions(teamId: string) {
  return queryOptions<RosterMember[]>({
    queryKey: teamKeys.roster(teamId),
    queryFn: () => fetchTeamRoster(teamId),
    staleTime: 60_000,
    enabled: !!teamId,
  });
}

export function teamActivityOptions(teamId: string) {
  return infiniteQueryOptions<
    ActivityFeedPage,
    Error,
    InfiniteData<ActivityFeedPage, string | null>,
    ReturnType<typeof teamKeys.activity>,
    string | null
  >({
    queryKey: teamKeys.activity(teamId),
    queryFn: ({ pageParam }) => fetchTeamActivity(teamId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
    enabled: !!teamId,
  });
}

export function teamAnnouncementsOptions(teamId: string) {
  return queryOptions<Announcement[]>({
    queryKey: teamKeys.announcements(teamId),
    queryFn: () => fetchTeamAnnouncements(teamId),
    staleTime: 120_000,
    enabled: !!teamId,
  });
}

export function inviteCodesOptions(teamId: string) {
  return queryOptions<InviteCode[]>({
    queryKey: teamKeys.inviteCodes(teamId),
    queryFn: () => fetchInviteCodes(teamId),
    staleTime: 60_000,
    enabled: !!teamId,
  });
}

export function slugCheckOptions(teamId: string, slug: string) {
  return queryOptions<{ available: boolean }>({
    queryKey: teamKeys.slugCheck(teamId, slug),
    queryFn: () => checkSlugAvailability(teamId, slug),
    staleTime: 30_000,
    enabled: !!teamId && slug.length >= 3,
  });
}
