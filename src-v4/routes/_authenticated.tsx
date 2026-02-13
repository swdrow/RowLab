/**
 * Authenticated layout route: guards all child routes behind auth.
 *
 * beforeLoad: redirects to /login if user is not authenticated.
 * Only redirects after auth initialization is complete (prevents flash).
 * Component: renders Outlet (shell comes in Plan 04).
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // Wait for auth initialization before making redirect decisions
    if (!context.auth.isInitialized) {
      return;
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Shell (sidebar, top bar) will be added in Plan 04.
  // For now, just render the child route content.
  return <Outlet />;
}
