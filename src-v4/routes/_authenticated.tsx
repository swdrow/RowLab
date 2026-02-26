/**
 * Authenticated layout route: guards all child routes behind auth.
 *
 * beforeLoad: redirects to /login if user is not authenticated.
 * Only redirects after auth initialization is complete (prevents flash).
 * Component: responsive shell with sidebar/top bar/bottom tabs.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  createFileRoute,
  redirect,
  useMatches,
  useMatch,
  useNavigate,
} from '@tanstack/react-router';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { BottomTabs } from '@/components/shell/BottomTabs';
import { AnimatedOutlet } from '@/components/shell/AnimatedOutlet';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { WorkoutSlideOver } from '@/features/workouts/components/WorkoutSlideOver';
import type { Workout } from '@/features/workouts/types';

export const Route = createFileRoute('/_authenticated')({
  errorComponent: RouteErrorFallback,
  beforeLoad: ({ context, location }) => {
    // Auth not yet initialized -- keep route in pending state.
    // InnerRoot shows AuthSkeleton and calls router.update() when auth resolves,
    // which re-triggers this beforeLoad with isInitialized: true.
    if (!context.auth?.isInitialized) {
      throw new Promise<void>(() => {});
    }

    if (!context.auth?.isAuthenticated) {
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
  const matches = useMatches();
  const match = useMatch({ strict: false });
  const nextMatchIndex = matches.findIndex((d) => d.id === match.id) + 1;
  const nextMatch = matches[nextMatchIndex];
  const navigate = useNavigate();

  // Global workout slide-over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Listen for oarbit:open-log-workout events (from sidebar, Cmd+K, workouts page)
  useEffect(() => {
    function handleOpenLogWorkout(e: Event) {
      const detail = (e as CustomEvent).detail;
      setEditingWorkout(detail?.workout ?? null);
      setSlideOverOpen(true);
    }
    window.addEventListener('oarbit:open-log-workout', handleOpenLogWorkout);
    return () => window.removeEventListener('oarbit:open-log-workout', handleOpenLogWorkout);
  }, []);

  const handleSlideOverClose = useCallback(() => {
    setSlideOverOpen(false);
    setEditingWorkout(null);
  }, []);

  const handleSlideOverSuccess = useCallback(() => {
    const wasEditing = editingWorkout !== null;
    setSlideOverOpen(false);
    setEditingWorkout(null);
    toast.success(wasEditing ? 'Workout updated' : 'Workout logged', {
      action: { label: 'View', onClick: () => navigate({ to: '/workouts' }) },
      duration: 4000,
    });
  }, [editingWorkout, navigate]);

  return (
    <div className="flex h-screen bg-void-deep">
      {/* Sidebar: desktop (full) / tablet (rail) / mobile (hidden) */}
      {!isMobile && <Sidebar />}

      {/* Main content column — z-10 ensures it sits above canvas pseudo-elements */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <TopBar />
        <main
          className={`flex flex-1 flex-col overflow-auto [&>*]:w-full ${isMobile ? 'pb-16' : ''}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <AnimatedOutlet key={nextMatch?.id} />
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom tabs: mobile only */}
      {isMobile && <BottomTabs />}

      {/* Global workout slide-over (z-45, below command palette at z-50) */}
      <WorkoutSlideOver
        isOpen={slideOverOpen}
        onClose={handleSlideOverClose}
        editingWorkout={editingWorkout}
        onSuccess={handleSlideOverSuccess}
      />
    </div>
  );
}
