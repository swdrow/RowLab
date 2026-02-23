/**
 * Join Team flow component.
 *
 * Standalone component for joining a team by entering an invite code manually.
 * Used in the teamless CTA area and potentially a /join route.
 *
 * Input field accepts ABC-1234 format codes, calls useJoinTeam mutation,
 * then navigates to the team dashboard on success.
 */
import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { IconLogIn, IconLink } from '@/components/icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';
import { joinTeamByCode } from '../api';
import type { TeamDetail } from '../types';

interface JoinTeamFlowProps {
  /** Called after successful join (optional -- component navigates by default) */
  onJoined?: (team: TeamDetail) => void;
}

export function JoinTeamFlow({ onJoined }: JoinTeamFlowProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { refreshAuth, switchTeam } = useAuth();
  const navigate = useNavigate();

  const joinMutation = useMutation<
    { team: TeamDetail; role: string; welcomeMessage?: string },
    Error,
    string
  >({
    mutationFn: (inviteCode) => joinTeamByCode(inviteCode),
    onSuccess: async (result) => {
      const teamName = result.team.name;
      await refreshAuth();
      await switchTeam(result.team.id);

      if (result.welcomeMessage) {
        toast.success(result.welcomeMessage);
      } else {
        toast.success(`Joined "${teamName}"!`);
      }

      if (onJoined) {
        onJoined(result.team);
      } else {
        await navigate({ to: '/' as string });
      }
    },
    onError: (err) => {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError?.response?.data?.error?.message || 'Invalid or expired invite code.';
      setError(message);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = code.trim();
      if (!trimmed) {
        setError('Please enter an invite code.');
        return;
      }

      joinMutation.mutate(trimmed);
    },
    [code, joinMutation]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-text-default">
        <IconLink width={14} height={14} className="text-text-faint" />
        Join with invite code
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="ABC-1234"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            error={error ?? undefined}
            className="font-mono tracking-wide"
          />
        </div>
        <Button type="submit" size="md" loading={joinMutation.isPending} disabled={!code.trim()}>
          <IconLogIn width={16} height={16} />
          Join
        </Button>
      </div>
    </form>
  );
}
