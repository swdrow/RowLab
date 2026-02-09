import { Eye, EyeOff } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../utils/api';
import { useGamificationEnabled } from '../../../hooks/useGamificationPreference';

interface GamificationSettingsProps {
  athleteId: string;
}

/**
 * Per-athlete gamification opt-out settings
 * Per CONTEXT.md: "Per-athlete opt-out: Athletes can disable gamification individually"
 */
export function GamificationSettings({ athleteId }: GamificationSettingsProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { enabled, athleteOptedIn, isLoading } = useGamificationEnabled();

  const updatePreference = useMutation({
    mutationFn: async (gamificationEnabled: boolean) => {
      // Use /me/preferences so athletes can update their own settings
      const response = await api.patch('/api/v1/athletes/me/preferences', {
        gamificationEnabled,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete', 'gamification-preference'] });
      showToast('success', 'Settings updated');
    },
    onError: () => {
      showToast('error', 'Failed to update settings');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-bdr-default">
        <div className="flex items-center gap-3">
          {athleteOptedIn ? (
            <Eye className="text-green-500" size={24} />
          ) : (
            <EyeOff className="text-txt-tertiary" size={24} />
          )}
          <div>
            <p className="font-medium text-txt-primary">Gamification Features</p>
            <p className="text-sm text-txt-secondary">
              {athleteOptedIn
                ? 'Achievements, PRs, and challenges are visible'
                : 'You see data without gamification overlays'}
            </p>
          </div>
        </div>

        <button
          onClick={() => updatePreference.mutate(!athleteOptedIn)}
          disabled={updatePreference.isPending || isLoading}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${athleteOptedIn ? 'bg-green-500' : 'bg-surface-elevated'}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
              ${athleteOptedIn ? 'translate-x-6' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      <p className="text-xs text-txt-tertiary">
        {athleteOptedIn
          ? 'Turn off to hide achievements, PRs, challenges, and streaks from your view.'
          : 'Turn on to see achievements, celebrate PRs, participate in challenges, and track streaks.'}
      </p>
    </div>
  );
}

export default GamificationSettings;
