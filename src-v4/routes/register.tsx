/**
 * Registration page route.
 * Public: redirects to / if already authenticated.
 * Registration is gated behind a valid invite token.
 */
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { api } from '@/lib/api';

const registerSearchSchema = z.object({
  invite: z.string().optional(),
});

export const Route = createFileRoute('/register')({
  validateSearch: zodValidator(registerSearchSchema),
  errorComponent: RouteErrorFallback,
  beforeLoad: ({ context }) => {
    if (context.auth?.isInitialized && context.auth?.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: RegisterPage,
  staticData: {
    breadcrumb: 'Register',
  },
});

interface InviteData {
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

function RegisterPage() {
  const { invite } = Route.useSearch();

  // No invite token: show "invitation required" message
  if (!invite) {
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
              <h2 className="text-lg font-display font-semibold text-text-bright">
                Invitation required
              </h2>
              <p className="text-sm text-text-dim">
                Registration requires an invitation. Ask your team admin for an invite link.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center text-sm font-medium text-accent-teal hover:text-accent-teal-hover transition-colors duration-150"
              >
                Back to login
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Has invite token: validate and show form or error
  return <InviteGatedRegister inviteToken={invite} />;
}

function InviteGatedRegister({ inviteToken }: { inviteToken: string }) {
  const { data, isLoading, isError, error } = useQuery<InviteData>({
    queryKey: ['invites', 'validate', inviteToken],
    queryFn: async () => {
      const res = await api.get(`/api/v1/invites/validate/${inviteToken}`);
      return res.data.data;
    },
    retry: false,
    staleTime: Infinity,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-void-deep p-4">
      <div className="w-full max-w-md">
        <Card padding="lg" className="rounded-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-text-bright font-display">
              oar<span className="text-accent-teal">bit</span>
            </h1>
            <p className="mt-1.5 text-sm text-text-dim">Create your account</p>
          </div>

          {isLoading && <RegisterSkeleton />}

          {isError && (
            <div className="flex flex-col gap-3 text-center">
              <div className="rounded-lg bg-data-poor/10 border border-data-poor/20 px-3 py-2.5 text-sm text-data-poor">
                {(error as { response?: { data?: { error?: { message?: string } } } })?.response
                  ?.data?.error?.message || 'This invitation has expired or is invalid.'}
              </div>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center text-sm font-medium text-accent-teal hover:text-accent-teal-hover transition-colors duration-150"
              >
                Back to login
              </Link>
            </div>
          )}

          {data && (
            <>
              {data.invitation.team && (
                <div className="mb-4 rounded-lg bg-void-raised/50 border border-edge-default px-3 py-2.5 text-sm text-text-default text-center">
                  You&apos;ve been invited to join{' '}
                  <span className="font-semibold text-text-bright">
                    {data.invitation.team.name}
                  </span>
                </div>
              )}
              <RegisterForm
                inviteToken={inviteToken}
                prefilledEmail={data.invitation.email || ''}
                emailLocked={!!data.invitation.email}
                assignedRole={data.invitation.role}
              />
            </>
          )}

          <div className="mt-6 border-t border-edge-default pt-5 text-center">
            <p className="text-sm text-text-dim">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent-teal hover:text-accent-teal-hover font-medium transition-colors duration-150"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RegisterSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Name field skeleton */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-20 rounded-sm bg-void-raised animate-shimmer" />
        <div className="h-10 w-full rounded-xl bg-void-raised animate-shimmer" />
      </div>
      {/* Email field skeleton */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-12 rounded-sm bg-void-raised animate-shimmer" />
        <div className="h-10 w-full rounded-xl bg-void-raised animate-shimmer" />
      </div>
      {/* Password field skeleton */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-16 rounded-sm bg-void-raised animate-shimmer" />
        <div className="h-10 w-full rounded-xl bg-void-raised animate-shimmer" />
      </div>
      {/* Confirm password field skeleton */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-28 rounded-sm bg-void-raised animate-shimmer" />
        <div className="h-10 w-full rounded-xl bg-void-raised animate-shimmer" />
      </div>
      {/* Button skeleton */}
      <div className="mt-1 h-12 w-full rounded-xl bg-void-raised animate-shimmer" />
    </div>
  );
}
