/**
 * /workouts/:workoutId detail route.
 *
 * Prefetches workout detail data in the loader, then renders the
 * WorkoutDetail component wrapped in Suspense with a shimmer skeleton.
 */

import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';

import { queryClient } from '@/lib/queryClient';
import { workoutDetailOptions } from '@/features/workouts/api';
import { WorkoutDetail } from '@/features/workouts/components/WorkoutDetail';
import { DetailSkeleton } from '@/features/workouts/components/DetailSkeleton';

export const Route = createFileRoute('/_authenticated/workouts/$workoutId')({
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Workout Detail',
  },
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(workoutDetailOptions(params.workoutId));
    return {};
  },
  component: WorkoutDetailPage,
});

function WorkoutDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <WorkoutDetail />
    </Suspense>
  );
}
