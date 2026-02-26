/**
 * Root route: wraps all content in AuthProvider and injects auth state
 * into router context via the InnerRoot pattern.
 *
 * The InnerRoot component reads auth state from context and passes it
 * to the router so that beforeLoad guards can access it.
 */
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/useAuth';
import { CosmicAtmosphere } from '@/components/ui/CosmicAtmosphere';
import { useEffect } from 'react';
import type { RouterContext } from '../router';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <InnerRoot />
    </AuthProvider>
  );
}

/**
 * InnerRoot: reads auth context and syncs it to router context.
 * This allows beforeLoad guards to access auth state without React hooks.
 */
function InnerRoot() {
  const auth = useAuth();
  const router = useRouter();

  // Sync auth state to router context so beforeLoad can access it
  useEffect(() => {
    router.update({
      context: {
        auth: {
          isAuthenticated: auth.isAuthenticated,
          isInitialized: auth.isInitialized,
          user: auth.user,
          teams: auth.teams,
          activeTeamId: auth.activeTeamId,
          activeTeamRole: auth.activeTeamRole,
        },
      },
    });
  }, [
    router,
    auth.isAuthenticated,
    auth.isInitialized,
    auth.user,
    auth.teams,
    auth.activeTeamId,
    auth.activeTeamRole,
  ]);

  // Show full-screen skeleton until auth initialization completes
  if (!auth.isInitialized) {
    return <AuthSkeleton />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <CosmicAtmosphere />
      <Outlet />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-void-overlay text-text-bright border-edge-default',
        }}
      />
    </MotionConfig>
  );
}

/**
 * Full-screen skeleton shown during auth initialization.
 * Prevents flash-of-login-page while the refresh token is being validated.
 */
function AuthSkeleton() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-void-deep">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing app icon */}
        <div className="h-12 w-12 rounded-xl bg-void-raised animate-shimmer" />
        {/* Loading bar */}
        <div className="h-1 w-32 overflow-hidden rounded-full bg-void-raised">
          <div className="h-full w-1/2 animate-shimmer rounded-full bg-accent-teal/40" />
        </div>
      </div>
    </div>
  );
}
