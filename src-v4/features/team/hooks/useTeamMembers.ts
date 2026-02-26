/**
 * Team roster hook.
 *
 * Wraps useSuspenseQuery for team roster data.
 * Suspense boundary required in parent component.
 */
import { useSuspenseQuery } from '@tanstack/react-query';
import { teamRosterOptions } from '../api';
import type { RosterMember } from '../types';

export function useTeamMembers(teamId: string): RosterMember[] {
  const { data } = useSuspenseQuery(teamRosterOptions(teamId));
  return data;
}
