/**
 * Compact horizontal profile card for the dashboard header.
 * Shows avatar, name, team, streak, and quick weekly/monthly stats.
 * Replaces the previous HeroSection with a denser, Strava-like layout.
 */

import { motion } from 'motion/react';
import { IconFlame, IconTrendingUp, IconCalendar, IconAward } from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import { Card } from '@/components/ui/Card';
import { slideUpDramatic } from '@/lib/animations';
import { formatNumber } from '@/lib/format';
import type { StatsData } from '../types';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour <= 16) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Mini stat chip                                                      */
/* ------------------------------------------------------------------ */

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon width={14} height={14} className={accent ? 'text-accent-teal' : 'text-text-faint'} />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-text-faint leading-none">
          {label}
        </span>
        <span className="text-sm font-mono font-semibold text-text-bright tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProfileCard                                                         */
/* ------------------------------------------------------------------ */

interface ProfileCardProps {
  userName: string;
  avatar?: string | null;
  teamName?: string | null;
  stats: StatsData;
}

export function ProfileCard({ userName, avatar, teamName, stats }: ProfileCardProps) {
  const greeting = getGreeting();
  const firstName = getFirstName(userName);
  const initials = getInitials(userName);
  const { streak, range } = stats;

  return (
    <motion.div {...slideUpDramatic}>
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={userName}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-accent-teal/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-accent-teal/15 flex items-center justify-center ring-2 ring-accent-teal/20">
                <span className="text-lg font-display font-bold text-accent-teal">{initials}</span>
              </div>
            )}
          </div>

          {/* Name + team + greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-faint">{greeting}</p>
            <h1 className="text-xl font-display font-bold text-heading-gradient truncate">
              {firstName}
            </h1>
            {teamName && <p className="text-xs text-text-faint truncate">{teamName}</p>}
          </div>

          {/* Streak indicator */}
          {streak.current > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-data-warning/10 shrink-0">
              <IconFlame width={16} height={16} className="text-data-warning streak-flame" />
              <div className="flex flex-col">
                <span className="text-sm font-mono font-bold text-data-warning tabular-nums">
                  {streak.current}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-data-warning/70 leading-none">
                  day streak
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-5 sm:gap-8 mt-4 pt-3 border-t border-edge-default/30">
          <MiniStat
            icon={IconTrendingUp}
            label="This period"
            value={formatNumber(range.meters)}
            accent
          />
          <MiniStat icon={IconCalendar} label="Active days" value={String(range.activeDays)} />
          <MiniStat icon={IconAward} label="Workouts" value={String(range.workouts)} />
          {streak.current > 0 && (
            <div className="sm:hidden">
              <MiniStat icon={IconFlame} label="Streak" value={`${streak.current}d`} />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
