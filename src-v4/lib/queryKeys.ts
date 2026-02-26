/**
 * Query key factory for TanStack Query.
 * Provides structured keys for cache invalidation and prefetching.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  invites: {
    all: ['invites'] as const,
    validate: (code: string) => [...queryKeys.invites.all, 'validate', code] as const,
  },
  athletes: {
    all: ['athletes'] as const,
    search: (query: string) => [...queryKeys.athletes.all, 'search', query] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (range?: string) => [...queryKeys.dashboard.all, 'stats', range] as const,
    workouts: (limit?: number) => [...queryKeys.dashboard.all, 'workouts', limit] as const,
    prs: () => [...queryKeys.dashboard.all, 'prs'] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    feed: (filters: Record<string, unknown>) =>
      [...queryKeys.workouts.all, 'feed', filters] as const,
    detail: (id: string) => [...queryKeys.workouts.all, 'detail', id] as const,
    calendar: (month: string) => [...queryKeys.workouts.all, 'calendar', month] as const,
  },
  profile: {
    all: ['profile'] as const,
    data: () => [...queryKeys.profile.all, 'data'] as const,
    stats: (range?: string) => [...queryKeys.profile.all, 'stats', range] as const,
    trends: (range: string) => [...queryKeys.profile.all, 'trends', range] as const,
    achievements: () => [...queryKeys.profile.all, 'achievements'] as const,
    prs: () => [...queryKeys.profile.all, 'prs'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    pmc: (filters: { range: string; sport: string | null }) =>
      [...queryKeys.analytics.all, 'pmc', filters] as const,
    volume: (filters: { range: string; granularity: string; metric: string }) =>
      [...queryKeys.analytics.all, 'volume', filters] as const,
  },
  feed: {
    all: ['feed'] as const,
    list: (filters: { filter: string }) => [...queryKeys.feed.all, 'list', filters] as const,
    followStats: () => [...queryKeys.feed.all, 'followStats'] as const,
  },
  settings: {
    all: ['settings'] as const,
    user: () => [...queryKeys.settings.all, 'user'] as const,
  },
  integrations: {
    all: ['integrations'] as const,
    c2: {
      all: ['integrations', 'c2'] as const,
      status: () => ['integrations', 'c2', 'status'] as const,
    },
    strava: {
      all: ['integrations', 'strava'] as const,
      status: () => ['integrations', 'strava', 'status'] as const,
    },
  },
} as const;
