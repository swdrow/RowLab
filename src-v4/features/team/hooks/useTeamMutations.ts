/**
 * Team mutation hooks.
 *
 * Each mutation invalidates relevant caches on success and shows
 * toast feedback via sonner. Auth-affecting mutations (create, join,
 * leave, delete) also call refreshAuth to update the teams list.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import {
  teamKeys,
  createTeam,
  joinTeamByCode,
  leaveTeam,
  deleteTeam,
  createAnnouncement,
  generateInviteCode,
  revokeInviteCode,
  updateTeamSettings,
  updateMemberRole,
  removeMember,
} from '../api';
import type {
  CreateTeamInput,
  GenerateInviteCodeInput,
  UpdateTeamInput,
  TeamDetail,
  Announcement,
  InviteCode,
} from '../types';

// ---------------------------------------------------------------------------
// Error message extraction
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: { data?: { error?: { message?: string } } };
  };
  return axiosError?.response?.data?.error?.message || fallback;
}

// ---------------------------------------------------------------------------
// Create team
// ---------------------------------------------------------------------------

export function useCreateTeam() {
  const qc = useQueryClient();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation<TeamDetail, Error, CreateTeamInput>({
    mutationFn: (input) => createTeam(input),
    onSuccess: async (team) => {
      toast.success(`Created "${team.name}"!`);
      await refreshAuth();
      qc.invalidateQueries({ queryKey: teamKeys.all });
      await navigate({ to: '/' as string });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create team.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Join team by invite code
// ---------------------------------------------------------------------------

export function useJoinTeam() {
  const qc = useQueryClient();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation<{ team: TeamDetail; role: string; welcomeMessage?: string }, Error, string>({
    mutationFn: (code) => joinTeamByCode(code),
    onSuccess: async (result) => {
      toast.success(`Joined "${result.team.name}"!`);
      await refreshAuth();
      qc.invalidateQueries({ queryKey: teamKeys.all });
      await navigate({ to: '/' as string });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to join team.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Leave team
// ---------------------------------------------------------------------------

export function useLeaveTeam() {
  const qc = useQueryClient();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation<void, Error, string>({
    mutationFn: (teamId) => leaveTeam(teamId),
    onSuccess: async () => {
      toast.success('Left team.');
      await refreshAuth();
      qc.invalidateQueries({ queryKey: teamKeys.all });
      await navigate({ to: '/' as string });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to leave team.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Delete team
// ---------------------------------------------------------------------------

export function useDeleteTeam() {
  const qc = useQueryClient();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  return useMutation<void, Error, string>({
    mutationFn: (teamId) => deleteTeam(teamId),
    onSuccess: async () => {
      toast.success('Team deleted.');
      await refreshAuth();
      qc.invalidateQueries({ queryKey: teamKeys.all });
      await navigate({ to: '/' as string });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete team.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Create announcement
// ---------------------------------------------------------------------------

export function useCreateAnnouncement(teamId: string) {
  const qc = useQueryClient();

  return useMutation<Announcement, Error, { title: string; content: string; isPinned?: boolean }>({
    mutationFn: (input) => createAnnouncement(teamId, input),
    onSuccess: () => {
      toast.success('Announcement posted.');
      qc.invalidateQueries({ queryKey: teamKeys.announcements(teamId) });
      qc.invalidateQueries({ queryKey: teamKeys.activity(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to post announcement.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Generate invite code
// ---------------------------------------------------------------------------

export function useGenerateInviteCode(teamId: string) {
  const qc = useQueryClient();

  return useMutation<InviteCode, Error, GenerateInviteCodeInput>({
    mutationFn: (input) => generateInviteCode(teamId, input),
    onSuccess: () => {
      toast.success('Invite code generated.');
      qc.invalidateQueries({ queryKey: teamKeys.inviteCodes(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to generate invite code.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Revoke invite code
// ---------------------------------------------------------------------------

export function useRevokeInviteCode(teamId: string) {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (codeId) => revokeInviteCode(teamId, codeId),
    onSuccess: () => {
      toast.success('Invite code revoked.');
      qc.invalidateQueries({ queryKey: teamKeys.inviteCodes(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to revoke invite code.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Update team settings
// ---------------------------------------------------------------------------

export function useUpdateTeamSettings(teamId: string) {
  const qc = useQueryClient();

  return useMutation<TeamDetail, Error, UpdateTeamInput>({
    mutationFn: (input) => updateTeamSettings(teamId, input),
    onSuccess: () => {
      toast.success('Team settings updated.');
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      qc.invalidateQueries({ queryKey: teamKeys.overview(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update settings.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Update member role
// ---------------------------------------------------------------------------

export function useUpdateMemberRole(teamId: string) {
  const qc = useQueryClient();

  return useMutation<void, Error, { userId: string; role: string }>({
    mutationFn: ({ userId, role }) => updateMemberRole(teamId, userId, role),
    onSuccess: () => {
      toast.success('Member role updated.');
      qc.invalidateQueries({ queryKey: teamKeys.roster(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update member role.'));
    },
  });
}

// ---------------------------------------------------------------------------
// Remove member
// ---------------------------------------------------------------------------

export function useRemoveMember(teamId: string) {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (userId) => removeMember(teamId, userId),
    onSuccess: () => {
      toast.success('Member removed.');
      qc.invalidateQueries({ queryKey: teamKeys.roster(teamId) });
      qc.invalidateQueries({ queryKey: teamKeys.activity(teamId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to remove member.'));
    },
  });
}
