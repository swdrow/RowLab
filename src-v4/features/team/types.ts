/**
 * Team feature types.
 *
 * Covers team detail, overview stats, roster, activity feed,
 * announcements, invite codes, and mutation inputs.
 */

// ---------------------------------------------------------------------------
// Team detail (from by-identifier resolution)
// ---------------------------------------------------------------------------

export interface TeamDetail {
  id: string;
  name: string;
  generatedId: string;
  slug: string | null;
  description: string | null;
  sport: string | null;
  welcomeMessage: string | null;
  isPublic: boolean;
  role: string; // OWNER, COACH, ATHLETE (user's role in this team)
  memberCount: number;
}

// ---------------------------------------------------------------------------
// Team overview stats (dashboard)
// ---------------------------------------------------------------------------

export interface TeamOverview {
  totalMeters: number;
  activeMembers: number;
  workoutsThisWeek: number;
}

// ---------------------------------------------------------------------------
// Roster member card
// ---------------------------------------------------------------------------

export interface RosterMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
  lastWorkoutDate: string | null;
  workoutsLast30Days: number;
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | 'member_joined'
  | 'member_left'
  | 'role_changed'
  | 'announcement'
  | 'team_created'
  | 'team_updated'
  | 'invite_generated'
  | 'workout'
  | 'pr'
  | 'session_completed'
  | 'achievement_unlocked';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  actorId: string | null;
  actorName: string | null;
  actorAvatarUrl: string | null;
  title: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityFeedPage {
  events: ActivityEvent[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  authorName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Invite code
// ---------------------------------------------------------------------------

export interface InviteCode {
  id: string;
  code: string;
  role: string;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface CreateTeamInput {
  name: string;
  description?: string;
  sport?: string;
  isPublic?: boolean;
}

export interface GenerateInviteCodeInput {
  role: 'COACH' | 'ATHLETE';
  expiry: '24h' | '7d' | '30d' | 'never';
  maxUses: 1 | 5 | 10 | 25 | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  sport?: string;
  slug?: string;
  welcomeMessage?: string;
  isPublic?: boolean;
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export const ROLE_DISPLAY: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  COACH: 'Coach',
  ATHLETE: 'Athlete',
};

export function isAdmin(role: string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function isAdminOrAbove(role: string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function isCoachOrAbove(role: string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'COACH';
}
