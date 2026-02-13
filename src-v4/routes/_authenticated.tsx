/**
 * Authenticated layout route: guards all child routes behind auth.
 *
 * beforeLoad: redirects to /login if user is not authenticated.
 * Only redirects after auth initialization is complete (prevents flash).
 * Component: responsive shell with sidebar/top bar/bottom tabs.
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { BottomTabs } from '@/components/shell/BottomTabs';

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
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-ink-deep">
      {/* Sidebar: desktop (full) / tablet (rail) / mobile (hidden) */}
      {!isMobile && <Sidebar />}

      {/* Main content column */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className={`flex-1 overflow-auto ${isMobile ? 'pb-16' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Bottom tabs: mobile only */}
      {isMobile && <BottomTabs />}
    </div>
  );
}
