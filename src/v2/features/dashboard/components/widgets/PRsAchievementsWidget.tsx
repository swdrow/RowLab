import { Link } from 'react-router-dom';
import { Trophy, Medal, CaretRight } from '@phosphor-icons/react';
import { usePersonalRecords } from '../../../../hooks/usePersonalRecords';
import { useAchievements } from '../../../../hooks/useAchievements';
import { formatSecondsToTime } from '../../../../utils/timeFormatters';
import type { WidgetProps } from '../../types';
import type { AchievementRarity } from '../../../../types/gamification';

const RARITY_COLORS: Record<AchievementRarity, string> = {
  Common: 'bg-gray-500/10 text-gray-400',
  Rare: 'bg-blue-500/10 text-blue-400',
  Epic: 'bg-purple-500/10 text-purple-400',
  Legendary: 'bg-amber-500/10 text-amber-400',
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export function PRsAchievementsWidget(_props: WidgetProps) {
  const { data: prs = [], isLoading: prsLoading } = usePersonalRecords();
  const {
    achievements,
    unlockedCount,
    totalCount,
    isLoading: achievementsLoading,
  } = useAchievements();

  const isLoading = prsLoading || achievementsLoading;

  const recentPRs = [...prs]
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, 3);

  const recentlyUnlocked = achievements
    .filter((a) => a.isUnlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink-bright flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent-copper" weight="fill" />
          PRs & Achievements
        </h3>
        <Link to="/app/achievements" className="text-sm text-accent-copper hover:underline">
          View all
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-ink-base rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentPRs.length === 0 && recentlyUnlocked.length === 0 ? (
          <div className="text-center py-8 text-ink-muted">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No PRs or achievements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* PRs Section */}
            {recentPRs.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                  Recent PRs
                </h4>
                <div className="space-y-2">
                  {recentPRs.map((pr) => (
                    <div
                      key={pr.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-ink-base
                        border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <Medal className="w-4 h-4 text-amber-400" weight="fill" />
                        <div>
                          <div className="text-sm font-medium text-ink-bright">{pr.testType}</div>
                          <div className="text-xs text-ink-muted">
                            {formatRelativeDate(pr.achievedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-semibold text-ink-bright">
                          {formatSecondsToTime(pr.result)}
                        </div>
                        {pr.improvement && pr.improvement > 0 && (
                          <div className="text-xs text-green-400">
                            -{formatSecondsToTime(pr.improvement)} faster
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                  Achievements
                </h4>
                <span className="text-xs text-ink-muted">
                  {unlockedCount} / {totalCount}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-ink-base rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-accent-copper rounded-full transition-all duration-500"
                  style={{
                    width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%',
                  }}
                />
              </div>

              {recentlyUnlocked.length > 0 ? (
                <div className="space-y-2">
                  {recentlyUnlocked.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-ink-base
                        border border-white/[0.06] group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" weight="fill" />
                        <span className="text-sm font-medium text-ink-bright truncate">
                          {achievement.name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${RARITY_COLORS[achievement.rarity]}`}
                      >
                        {achievement.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-muted text-center py-2">
                  No achievements unlocked yet
                </p>
              )}
            </div>

            {/* Link to achievements page */}
            <Link
              to="/app/achievements"
              className="flex items-center justify-center gap-1 text-sm text-accent-copper hover:underline pt-1"
            >
              See all achievements
              <CaretRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
