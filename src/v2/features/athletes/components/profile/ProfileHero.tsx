import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import type { AthleteDetailData } from '@v2/types/athletes';

// ─── Side & Status Styling ─────────────────────────────────────────
const SIDE_COLORS: Record<string, string> = {
  Port: 'bg-red-500',
  Starboard: 'bg-green-500',
  Both: 'bg-blue-500',
  Cox: 'bg-purple-500',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-zinc-500/10 text-zinc-500',
  injured: 'bg-amber-500/10 text-amber-600',
  graduated: 'bg-blue-500/10 text-blue-600',
};

// ─── Metric Card Component ─────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
}

function MetricCard({ label, value, subtitle, icon }: MetricCardProps) {
  const hasData = value !== '\u2014';

  return (
    <div className="rounded-lg bg-bg-surface/60 backdrop-blur-sm border border-bdr-subtle p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-txt-tertiary">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={`font-mono text-2xl font-semibold leading-tight ${
          hasData ? 'text-txt-primary' : 'text-txt-tertiary'
        }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </span>
      {subtitle && <span className="text-[10px] text-txt-tertiary truncate">{subtitle}</span>}
    </div>
  );
}

// ─── SVG Icons (inline, 14px) ──────────────────────────────────────
function TimerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

// ─── ProfileHero Component ─────────────────────────────────────────
export interface ProfileHeroProps {
  athlete: AthleteDetailData;
}

export function ProfileHero({ athlete }: ProfileHeroProps) {
  const fullName = `${athlete.firstName} ${athlete.lastName}`;
  const side = athlete.side;
  const status = athlete.status || 'active';

  // Compute metric values
  const latestErg = athlete.latestErgTest;
  const ergValue = latestErg ? latestErg.time : '\u2014';
  const ergSubtitle = latestErg ? latestErg.testType : 'No data';

  const streak = athlete.attendanceStreak ?? 0;
  const streakValue = streak > 0 ? String(streak) : '\u2014';
  const streakSubtitle = streak > 0 ? `day${streak !== 1 ? 's' : ''} streak` : 'No data';

  const rank = athlete.teamRank;
  const rankValue = rank != null ? `#${rank}` : '\u2014';
  const rankSubtitle = rank != null ? 'team rank' : 'No data';

  const prCount = athlete.personalRecords?.length ?? 0;
  const prValue = prCount > 0 ? String(prCount) : '\u2014';
  const prSubtitle = prCount > 0 ? `personal record${prCount !== 1 ? 's' : ''}` : 'No data';

  return (
    <div className="space-y-4">
      {/* Avatar + Name Section */}
      <div className="flex items-center gap-4">
        <AthleteAvatar
          firstName={athlete.firstName}
          lastName={athlete.lastName}
          photoUrl={athlete.avatar}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-txt-primary truncate">{fullName}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {side && (
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${SIDE_COLORS[side] || ''}`} />
                <span className="text-xs text-txt-secondary font-medium">{side}</span>
              </span>
            )}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                STATUS_STYLES[status] || STATUS_STYLES.active
              }`}
            >
              {status}
            </span>
            {athlete.classYear && (
              <span
                className="text-xs text-txt-tertiary font-mono"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                '{String(athlete.classYear).slice(-2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid (2x2) */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Latest Erg"
          value={ergValue}
          subtitle={ergSubtitle}
          icon={<TimerIcon />}
        />
        <MetricCard
          label="Streak"
          value={streakValue}
          subtitle={streakSubtitle}
          icon={<FlameIcon />}
        />
        <MetricCard label="Ranking" value={rankValue} subtitle={rankSubtitle} icon={<HashIcon />} />
        <MetricCard label="PRs" value={prValue} subtitle={prSubtitle} icon={<TrophyIcon />} />
      </div>
    </div>
  );
}

export default ProfileHero;
