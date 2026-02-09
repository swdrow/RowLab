import { AchievementGrid, StreakDisplay } from '../features/gamification';
import { useGamificationEnabled } from '../hooks/useGamificationPreference';
import { useCheckProgress } from '../hooks/useAchievements';
import { RefreshCw, Trophy } from 'lucide-react';

export function AchievementsPage() {
  const { enabled } = useGamificationEnabled();
  const checkProgress = useCheckProgress();

  if (!enabled) {
    return (
      <div className="p-8 text-center">
        <Trophy className="w-16 h-16 text-accent-primary/30 mx-auto mb-4" />
        <h1 className="text-2xl font-display font-bold text-txt-primary mb-2">Achievements</h1>
        <p className="text-txt-secondary">
          Gamification is disabled. Enable it in settings to view achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/[0.06] via-accent-primary/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-primary mb-2">
              GAMIFICATION
            </p>
            <h1 className="text-4xl font-display font-bold text-txt-primary tracking-tight">
              Achievements
            </h1>
            <p className="text-sm text-txt-secondary mt-2">Track milestones and unlock badges</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => checkProgress.mutate()}
              disabled={checkProgress.isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-primary to-accent-primary/90 text-white rounded-xl shadow-glow hover:shadow-glow hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={checkProgress.isPending ? 'animate-spin' : ''} />
              Check Progress
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Streaks section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-primary">
              Current Streaks
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-accent-primary/20 to-transparent" />
          </div>
          <StreakDisplay />
        </section>

        {/* Achievements grid */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-primary">
              All Achievements
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-accent-primary/20 to-transparent" />
          </div>
          <AchievementGrid showLocked />
        </section>
      </div>
    </div>
  );
}

export default AchievementsPage;
