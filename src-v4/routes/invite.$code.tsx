/**
 * Invite claim route: /invite/:code
 * Handles both new users (redirect to register) and existing users (claim invite).
 *
 * States:
 * 1. Loading: skeleton while validating invite
 * 2. Invalid: error card with link to login
 * 3. Valid + not authenticated: redirect to /register?invite={code}
 * 4. Valid + authenticated: show claim card (accept/decline)
 */
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/invite/$code')({
  component: InviteClaimPage,
  staticData: {
    breadcrumb: 'Invite',
  },
});

interface InviteValidation {
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

function InviteClaimPage() {
  const { code } = Route.useParams();
  const { isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  const { data, isLoading, isError, error } = useQuery<InviteValidation>({
    queryKey: ['invites', 'validate', code],
    queryFn: async () => {
      const res = await api.get(`/api/v1/invites/validate/${code}`);
      return res.data.data;
    },
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
      <div className="flex min-h-screen items-center justify-center bg-ink-deep p-4">
        <div className="w-full max-w-md">
          <GlassCard padding="lg" className="rounded-2xl">
            <InviteSkeleton />
          </GlassCard>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-deep p-4">
        <div className="w-full max-w-md">
          <GlassCard padding="lg" className="rounded-2xl text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-ink-primary font-display">
                Row<span className="text-accent-copper">Lab</span>
              </h1>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
                {(error as { response?: { data?: { error?: { message?: string } } } })?.response
                  ?.data?.error?.message || 'This invitation is invalid or has expired.'}
              </div>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center text-sm font-medium text-accent-copper hover:text-accent-copper-hover transition-colors duration-150"
              >
                Go to login
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Valid invite + authenticated: show claim card
  if (isAuthenticated && data) {
    return <InviteClaimCard code={code} invitation={data.invitation} />;
  }

  // Valid invite + not authenticated: redirecting to register (show loading)
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-deep p-4">
      <div className="w-full max-w-md">
        <GlassCard padding="lg" className="rounded-2xl text-center">
          <p className="text-sm text-ink-secondary">Redirecting to registration...</p>
        </GlassCard>
      </div>
    </div>
  );
}

function InviteClaimCard({
  code,
  invitation,
}: {
  code: string;
  invitation: InviteValidation['invitation'];
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
      // Refresh auth to pick up new team membership
      await refreshAuth();
      await navigate({ to: '/' });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Failed to claim invitation.';
      toast.error(message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-deep p-4">
      <div className="w-full max-w-md">
        <GlassCard padding="lg" className="rounded-2xl text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink-primary font-display">
              Row<span className="text-accent-copper">Lab</span>
            </h1>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-ink-primary">Team invitation</h2>

            <p className="text-sm text-ink-body">
              You've been invited to join{' '}
              <span className="font-semibold text-ink-primary">
                {invitation.team?.name || 'a team'}
              </span>
              {invitation.role && (
                <>
                  {' '}
                  as a{' '}
                  <span className="font-semibold text-accent-copper capitalize">
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
              <Button variant="ghost" className="flex-1" onClick={() => navigate({ to: '/' })}>
                Decline
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-32 rounded-lg bg-ink-raised animate-shimmer" />
      <div className="h-5 w-48 rounded-sm bg-ink-raised animate-shimmer" />
      <div className="h-4 w-64 rounded-sm bg-ink-raised animate-shimmer" />
      <div className="flex gap-3 w-full mt-2">
        <div className="flex-1 h-10 rounded-xl bg-ink-raised animate-shimmer" />
        <div className="flex-1 h-10 rounded-xl bg-ink-raised animate-shimmer" />
      </div>
    </div>
  );
}
