import { AchievementGrid, StreakDisplay } from '../features/gamification';
import { useGamificationEnabled } from '../hooks/useGamificationPreference';
import { useCheckProgress } from '../hooks/useAchievements';
import { RefreshCw } from 'lucide-react';

export function AchievementsPage() {
  const { enabled } = useGamificationEnabled();
  const checkProgress = useCheckProgress();

  if (!enabled) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-txt-primary mb-2">Achievements</h1>
        <p className="text-txt-secondary">
          Gamification is disabled. Enable it in settings to view achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Achievements</h1>
          <p className="text-txt-secondary mt-1">
            Track your progress and unlock rewards
          </p>
        </div>

        <button
          onClick={() => checkProgress.mutate()}
          disabled={checkProgress.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-surface-hover hover:bg-surface-active rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={checkProgress.isPending ? 'animate-spin' : ''} />
          Check Progress
        </button>
      </div>

      {/* Streaks section */}
      <section>
        <StreakDisplay />
      </section>

      {/* Achievements grid */}
      <section>
        <h2 className="text-lg font-semibold text-txt-primary mb-4">All Achievements</h2>
        <AchievementGrid showLocked />
      </section>
    </div>
  );
}

export default AchievementsPage;
