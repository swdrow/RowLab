/**
 * Invite claim route: /invite/:code
 *
 * Handles BOTH invite systems:
 * 1. New TeamInviteCode system (ABC-1234 format): joins via POST /api/u/teams/join
 * 2. Old Invitation system (hex codes): validates then claims via /api/v1/invites/
 *
 * Detection: tries new system first. On 404, falls back to old system.
 *
 * Search params:
 * - ?role= (hint from invite link, actual role comes from code record)
 *
 * States:
 * 1. Loading: skeleton while resolving invite
 * 2. Invalid: error card with link to login
 * 3. Valid + not authenticated: redirect to /register?invite={code}
 * 4. Valid + authenticated (new system): show join card
 * 5. Valid + authenticated (old system): show legacy claim card
 */
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { joinTeamByCode } from '@/features/team/api';
import type { TeamDetail } from '@/features/team/types';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Search params
// ---------------------------------------------------------------------------

const inviteSearchSchema = z.object({
  role: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/invite/$code')({
  errorComponent: RouteErrorFallback,
  component: InviteClaimPage,
  validateSearch: zodValidator(inviteSearchSchema),
  staticData: {
    breadcrumb: 'Invite',
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Old invitation system validation response */
interface LegacyInviteValidation {
  invitation: {
    id: string;
    email?: string;
    role?: string;
    team?: {
      id: string;
      name: string;
    };
    status: string;
  };
}

/** Unified resolved invite data */
type ResolvedInvite =
  | {
      system: 'new';
      teamName: string;
      role: string;
      code: string;
    }
  | {
      system: 'legacy';
      invitation: LegacyInviteValidation['invitation'];
      code: string;
    };

// ---------------------------------------------------------------------------
// Invite resolution: tries new system first, falls back to legacy
// ---------------------------------------------------------------------------

async function resolveInvite(code: string): Promise<ResolvedInvite> {
  // Try new TeamInviteCode system first via validate endpoint
  try {
    const res = await api.get(`/api/v1/teams/invite-codes/validate/${encodeURIComponent(code)}`);
    const data = res.data.data as { teamName: string; role: string; code: string };
    return {
      system: 'new',
      teamName: data.teamName,
      role: data.role,
      code,
    };
  } catch (newErr: unknown) {
    const status = (newErr as { response?: { status?: number } })?.response?.status;
    // If not a 404, the code was found but had another error -- don't fallback
    if (status && status !== 404) {
      throw newErr;
    }
  }

  // Fall back to old Invitation system
  const res = await api.get(`/api/v1/invites/validate/${code}`);
  const data = res.data.data as LegacyInviteValidation;
  return {
    system: 'legacy',
    invitation: data.invitation,
    code,
  };
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function InviteClaimPage() {
  const { code } = Route.useParams();
  const { isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  const { data, isLoading, isError, error } = useQuery<ResolvedInvite>({
    queryKey: ['invites', 'resolve', code],
    queryFn: () => resolveInvite(code),
    retry: false,
    staleTime: Infinity,
  });

  // Redirect unauthenticated users to register with invite token
  useEffect(() => {
    if (isInitialized && !isAuthenticated && data && !hasRedirected) {
      setHasRedirected(true);
      void navigate({
        to: '/register',
        search: { invite: code },
      });
    }
  }, [isInitialized, isAuthenticated, data, code, navigate, hasRedirected]);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
        <div className="w-full max-w-md">
          <Card padding="lg" className="rounded-2xl">
            <InviteSkeleton />
          </Card>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
        <div className="w-full max-w-md">
          <Card padding="lg" className="rounded-2xl text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
                oar<span className="text-accent-teal">bit</span>
              </h1>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
                {(error as { response?: { data?: { error?: { message?: string } } } })?.response
                  ?.data?.error?.message || 'This invitation is invalid or has expired.'}
              </div>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center text-sm font-medium text-accent-teal hover:text-accent-teal-hover transition-colors duration-150"
              >
                Go to login
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Valid invite + authenticated: render appropriate claim card
  if (isAuthenticated && data) {
    if (data.system === 'new') {
      return <NewInviteClaimCard resolved={data} />;
    }
    return <LegacyInviteClaimCard code={code} invitation={data.invitation} />;
  }

  // Valid invite + not authenticated: redirecting to register (show loading)
  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="rounded-2xl text-center">
          <p className="text-sm text-text-dim">Redirecting to registration...</p>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New system claim card (TeamInviteCode)
// ---------------------------------------------------------------------------

function NewInviteClaimCard({
  resolved,
}: {
  resolved: Extract<ResolvedInvite, { system: 'new' }>;
}) {
  const navigate = useNavigate();
  const { refreshAuth, switchTeam } = useAuth();

  const joinMutation = useMutation<
    { team: TeamDetail; role: string; welcomeMessage?: string },
    Error,
    string
  >({
    mutationFn: (inviteCode) => joinTeamByCode(inviteCode),
    onSuccess: async (result) => {
      await refreshAuth();
      await switchTeam(result.team.id);

      if (result.welcomeMessage) {
        toast.success(result.welcomeMessage);
      } else {
        toast.success(`Joined "${result.team.name}"!`);
      }

      await navigate({ to: '/' as string });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Failed to join team.';
      toast.error(message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="rounded-2xl text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
              oar<span className="text-accent-teal">bit</span>
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-display font-semibold text-text-bright">Team invitation</h2>

            <p className="text-sm text-text-default">
              You&apos;ve been invited to join{' '}
              <span className="font-semibold text-text-bright">{resolved.teamName}</span> as a{' '}
              <span className="font-semibold text-accent-teal capitalize">
                {resolved.role.toLowerCase()}
              </span>
            </p>

            <div className="flex gap-3 mt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => joinMutation.mutate(resolved.code)}
                loading={joinMutation.isPending}
              >
                Join team
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => void navigate({ to: '/' })}>
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legacy system claim card (old Invitation model)
// ---------------------------------------------------------------------------

function LegacyInviteClaimCard({
  code,
  invitation,
}: {
  code: string;
  invitation: LegacyInviteValidation['invitation'];
}) {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/v1/invites/claim/${code}`);
      return res.data.data;
    },
    onSuccess: async () => {
      const teamName = invitation.team?.name || 'the team';
      toast.success(`Joined ${teamName}!`);
      await refreshAuth();
      await navigate({ to: '/' });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Failed to claim invitation.';
      toast.error(message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="rounded-2xl text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
              oar<span className="text-accent-teal">bit</span>
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-display font-semibold text-text-bright">Team invitation</h2>

            <p className="text-sm text-text-default">
              You&apos;ve been invited to join{' '}
              <span className="font-semibold text-text-bright">
                {invitation.team?.name || 'a team'}
              </span>
              {invitation.role && (
                <>
                  {' '}
                  as a{' '}
                  <span className="font-semibold text-accent-teal capitalize">
                    {invitation.role.toLowerCase()}
                  </span>
                </>
              )}
            </p>

            <div className="flex gap-3 mt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => claimMutation.mutate()}
                loading={claimMutation.isPending}
              >
                Accept
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => void navigate({ to: '/' })}>
                Decline
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function InviteSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-32 rounded-lg bg-void-raised animate-shimmer" />
      <div className="h-5 w-48 rounded-sm bg-void-raised animate-shimmer" />
      <div className="h-4 w-64 rounded-sm bg-void-raised animate-shimmer" />
      <div className="flex gap-3 w-full mt-2">
        <div className="flex-1 h-10 rounded-xl bg-void-raised animate-shimmer" />
        <div className="flex-1 h-10 rounded-xl bg-void-raised animate-shimmer" />
      </div>
    </div>
  );
}
