/**
 * /profile route -- user profile page with URL-persisted tab state.
 *
 * Prefetches profile data, stats, and PRs in the loader.
 * Tab state is persisted in ?tab= search param.
 */
import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import {
  profileQueryOptions,
  profileStatsQueryOptions,
  profilePRsQueryOptions,
} from '@/features/profile/api';
import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton';

/* ------------------------------------------------------------------ */
/* Search schema                                                       */
/* ------------------------------------------------------------------ */

const profileSearchSchema = z.object({
  tab: z.enum(['overview', 'training-log', 'prs', 'achievements', 'analytics']).catch('overview'),
});

export type ProfileSearch = z.infer<typeof profileSearchSchema>;

/* ------------------------------------------------------------------ */
/* Route definition                                                    */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/_authenticated/profile')({
  validateSearch: zodValidator(profileSearchSchema),
  errorComponent: RouteErrorFallback,
  staticData: {
    breadcrumb: 'Profile',
  },
  loader: async () => {
    await Promise.allSettled([
      queryClient.ensureQueryData(profileQueryOptions()),
      queryClient.ensureQueryData(profileStatsQueryOptions()),
      queryClient.ensureQueryData(profilePRsQueryOptions()),
    ]);
    return {};
  },
  component: ProfilePageRoute,
});

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function ProfilePageRoute() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage />
    </Suspense>
  );
}
