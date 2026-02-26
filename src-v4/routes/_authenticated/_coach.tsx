/**
 * Coach layout route: guards all coach tool routes behind role check.
 *
 * beforeLoad: redirects ATHLETE (and unauthenticated) users to '/'.
 * Accepts OWNER, ADMIN, COACH via role hierarchy check.
 * Component: renders Outlet directly with a fallback useEffect
 * for team-switch mid-session (role changes to ATHLETE while on coach route).
 */
import { createFileRoute, redirect, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/useAuth';
import { getRoleLevel } from '@/features/permissions/types';
import { useEffect } from 'react';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';

export const Route = createFileRoute('/_authenticated/_coach')({
  errorComponent: RouteErrorFallback,
  beforeLoad: ({ context }) => {
    // Wait for auth initialization before making role decisions
    if (!context.auth?.isInitialized) return;

    const role = context.auth?.activeTeamRole ?? null;
    const level = getRoleLevel(role);
    const coachLevel = getRoleLevel('COACH');

    // Redirect if not at least COACH level
    if (level < coachLevel) {
      throw redirect({ to: '/' });
    }
  },
  component: CoachLayout,
});

function CoachLayout() {
  const { activeTeamRole } = useAuth();
  const navigate = useNavigate();

  // Fallback: if role changes to ATHLETE while on a coach route (e.g. team switch),
  // navigate away since beforeLoad only runs on initial navigation
  useEffect(() => {
    const level = getRoleLevel(activeTeamRole);
    const coachLevel = getRoleLevel('COACH');

    if (level < coachLevel) {
      navigate({ to: '/' });
    }
  }, [activeTeamRole, navigate]);

  return <Outlet />;
}
