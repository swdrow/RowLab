/**
 * Settings query options and mutation helpers for TanStack Query.
 * GET /api/v1/settings — returns user settings including notificationPrefs, privacyPrefs
 * PATCH /api/v1/settings — partial update of user settings
 * POST /api/v1/auth/change-password — change user password
 * DELETE /api/v1/auth/account — soft-delete user account
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/features/auth/useAuth';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface NotificationPrefs {
  email: {
    weeklyTrainingSummary: boolean;
    prAchievements: boolean;
    teamAnnouncements: boolean;
    productUpdates: boolean;
  };
  push: {
    workoutReminders: boolean;
    teamActivity: boolean;
  };
  inApp: {
    allActivity: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
  };
}

export interface PrivacyPrefs {
  profileVisibility: 'public' | 'team' | 'private';
  workoutVisibility: 'same' | 'team' | 'private';
  showInLeaderboards: boolean;
}

export interface UserSettings {
  notificationPrefs?: NotificationPrefs;
  privacyPrefs?: PrivacyPrefs;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Query options                                                       */
/* ------------------------------------------------------------------ */

export function settingsQueryOptions() {
  return queryOptions<UserSettings>({
    queryKey: queryKeys.settings.user(),
    queryFn: async () => {
      const data = await apiClient.get<UserSettings | null>('/api/v1/settings');
      return (data ?? {}) as UserSettings;
    },
    staleTime: 5 * 60_000, // 5 min
  });
}

/* ------------------------------------------------------------------ */
/* Settings mutation hook                                              */
/* ------------------------------------------------------------------ */

export function useUpdateSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserSettings>) =>
      apiClient.patch<UserSettings>('/api/v1/settings', updates),
    onMutate: async (updates) => {
      // Cancel outstanding queries
      await qc.cancelQueries({ queryKey: queryKeys.settings.user() });

      // Snapshot previous value for rollback
      const previous = qc.getQueryData<UserSettings>(queryKeys.settings.user());

      // Optimistic update: merge updates into cache
      qc.setQueryData<UserSettings>(queryKeys.settings.user(), (old) => ({
        ...(old ?? {}),
        ...updates,
      }));

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        qc.setQueryData(queryKeys.settings.user(), context.previous);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      qc.invalidateQueries({ queryKey: queryKeys.settings.user() });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Change password mutation                                            */
/* ------------------------------------------------------------------ */

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) =>
      apiClient.post<{ message: string }>('/api/v1/auth/change-password', {
        currentPassword,
        newPassword,
      }),
  });
}

/* ------------------------------------------------------------------ */
/* Delete account mutation                                             */
/* ------------------------------------------------------------------ */

export function useDeleteAccount() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ password }: { password: string }) =>
      apiClient.delete<{ message: string; deletedAt: string }>('/api/v1/auth/account', {
        data: { password, confirmation: 'DELETE' },
      }),
    onSuccess: async () => {
      // Clear auth state and redirect to goodbye page
      try {
        await logout();
      } catch {
        // Ignore logout errors -- tokens already revoked server-side
      }
      navigate({ to: '/goodbye' });
    },
  });
}
