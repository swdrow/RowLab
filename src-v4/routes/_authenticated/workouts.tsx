/**
 * /workouts layout route.
 *
 * Provides:
 * - URL search param validation via zodValidator (view, type, source, dates, calendarMode)
 * - Tab toggle (Feed | Calendar) that updates ?view= param
 * - Filter button with active filter count badge
 * - FAB (+) button that dispatches oarbit:open-log-workout event (global slide-over)
 * - WorkoutPageContext to pass onEdit/onDelete/onCreateNew to child routes
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { z } from 'zod';
import { IconFilter, IconPlus } from '@/components/icons';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';

import { Card } from '@/components/ui/Card';
import { TabToggle } from '@/components/ui/TabToggle';
import { useIsMobile } from '@/hooks/useBreakpoint';
import {
  WorkoutPageContext,
  type WorkoutPageContextValue,
} from '@/features/workouts/WorkoutPageContext';
import { FilterPopover, countActiveFilters } from '@/features/workouts/components/FilterPopover';
import { useDeleteWorkout } from '@/features/workouts/hooks/useWorkoutMutations';
import type { Workout } from '@/features/workouts/types';

/* ------------------------------------------------------------------ */
/* Search schema                                                       */
/* ------------------------------------------------------------------ */

const workoutSearchSchema = z.object({
  view: z.enum(['feed', 'calendar']).catch('feed'),
  type: z.string().optional().catch(undefined),
  source: z.enum(['manual', 'concept2', 'strava', 'garmin']).optional().catch(undefined),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
  calendarMode: z.enum(['monthly', 'weekly']).catch('monthly'),
  action: z.enum(['new']).optional().catch(undefined),
});

export type WorkoutSearch = z.infer<typeof workoutSearchSchema>;

/* ------------------------------------------------------------------ */
/* Route definition                                                    */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/_authenticated/workouts')({
  validateSearch: zodValidator(workoutSearchSchema),
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Workouts',
  },
  component: WorkoutsLayout,
});

/* ------------------------------------------------------------------ */
/* Layout component                                                    */
/* ------------------------------------------------------------------ */

function WorkoutsLayout() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isMobile = useIsMobile();

  // Filter popover state
  const [filterOpen, setFilterOpen] = useState(false);

  // FAB scroll-hide: hide when scrolling down, show when scrolling up
  const [fabVisible, setFabVisible] = useState(true);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setFabVisible(latest < prev || latest < 50);
  });

  // Delete dialog state
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null);

  const handleCreateNew = useCallback(() => {
    window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'));
  }, []);

  // Auto-open slide-over when navigated with ?action=new, then clear the param
  useEffect(() => {
    if (search.action === 'new') {
      handleCreateNew();
      void navigate({ search: (prev) => ({ ...prev, action: undefined }), replace: true });
    }
  }, [search.action, handleCreateNew, navigate]);

  const handleEdit = useCallback((workout: Workout) => {
    window.dispatchEvent(new CustomEvent('oarbit:open-log-workout', { detail: { workout } }));
  }, []);

  const handleDelete = useCallback((workout: Workout) => {
    setDeletingWorkout(workout);
  }, []);

  const setView = useCallback(
    (view: 'feed' | 'calendar') => {
      void navigate({
        search: (prev) => ({ ...prev, view }),
      });
    },
    [navigate]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      void navigate({
        search: (prev) => ({ ...prev, [key]: value }),
      });
    },
    [navigate]
  );

  const handleClearAllFilters = useCallback(() => {
    void navigate({
      search: (prev) => ({
        ...prev,
        type: undefined,
        source: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      }),
    });
  }, [navigate]);

  const activeFilterCount = countActiveFilters(search);

  // Context value for child routes
  const contextValue: WorkoutPageContextValue = useMemo(
    () => ({
      onEdit: handleEdit,
      onDelete: handleDelete,
      onCreateNew: handleCreateNew,
    }),
    [handleEdit, handleDelete, handleCreateNew]
  );

  return (
    <WorkoutPageContext.Provider value={contextValue}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <h1 className="text-heading-gradient text-2xl font-display font-semibold mb-4">Workouts</h1>

        {/* Tab toggle + Filter bar */}
        <div className="flex items-center justify-between mb-5">
          {/* Tab toggle */}
          <TabToggle
            tabs={[
              { id: 'feed', label: 'Feed' },
              { id: 'calendar', label: 'Calendar' },
            ]}
            activeTab={search.view}
            onTabChange={(id) => setView(id as 'feed' | 'calendar')}
            layoutId="workouts-view-toggle"
          />

          {/* Filter button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-void-raised text-text-bright'
                  : 'text-text-dim hover:text-text-default hover:bg-void-overlay'
              }`}
            >
              <IconFilter width={14} height={14} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-teal text-void-deep text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <FilterPopover
              isOpen={filterOpen}
              onClose={() => setFilterOpen(false)}
              activeType={search.type}
              activeSource={search.source}
              activeDateFrom={search.dateFrom}
              activeDateTo={search.dateTo}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
            />
          </div>
        </div>

        {/* Child route content */}
        <Outlet />
      </div>

      {/* FAB — 44px, scroll-hide, entrance animation */}
      <motion.button
        type="button"
        onClick={handleCreateNew}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: fabVisible ? 1 : 0,
          opacity: fabVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`fixed z-30 w-11 h-11 bg-accent-teal hover:bg-accent-teal-hover text-void-deep rounded-full shadow-focus flex items-center justify-center transition-colors ${
          isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'
        }`}
        aria-label="Log new workout"
      >
        <IconPlus width={20} height={20} />
      </motion.button>

      {/* Delete confirmation dialog */}
      {deletingWorkout && (
        <DeleteConfirmDialog
          workout={deletingWorkout}
          onCancel={() => setDeletingWorkout(null)}
          onConfirmed={() => setDeletingWorkout(null)}
        />
      )}
    </WorkoutPageContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation dialog                                          */
/* ------------------------------------------------------------------ */

function DeleteConfirmDialog({
  workout,
  onCancel,
  onConfirmed,
}: {
  workout: Workout;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const deleteWorkout = useDeleteWorkout();

  const handleConfirm = async () => {
    await deleteWorkout.mutateAsync(workout.id);
    onConfirmed();
  };

  return (
    <>
      {/* Backdrop */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop overlay dismiss pattern */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stopPropagation prevents backdrop dismiss on content click */}
        <Card
          padding="lg"
          variant="elevated"
          className="max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-text-bright text-base font-display font-semibold mb-2">
            Delete workout?
          </h3>
          <p className="text-text-dim text-sm mb-5">
            This cannot be undone. This workout will be permanently removed from your log.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-dim hover:text-text-default hover:bg-void-overlay transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleteWorkout.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-data-poor text-void-deep hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleteWorkout.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
