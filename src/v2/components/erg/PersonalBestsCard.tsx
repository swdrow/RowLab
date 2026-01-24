import type { PersonalBests, TestType } from '@v2/types/ergTests';

interface PersonalBestsCardProps {
  personalBests: PersonalBests;
  testTypes?: TestType[];
  className?: string;
}

/**
 * Format time in seconds to MM:SS.s
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

/**
 * Format split (500m pace) in seconds to MM:SS.s
 */
function formatSplit(seconds: number | null): string {
  if (seconds === null) return '—';
  return formatTime(seconds);
}

/**
 * Format date to MMM DD, YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Test type colors consistent with badges
 */
const testTypeColors: Record<TestType, { bg: string; border: string; text: string }> = {
  '2k': {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
  },
  '6k': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  '30min': {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
  },
  '500m': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

/**
 * Display personal best for a single test type
 */
function PersonalBestItem({
  testType,
  pb
}: {
  testType: TestType;
  pb: PersonalBests[TestType]
}) {
  const colors = testTypeColors[testType];

  if (!pb) {
    return (
      <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-semibold ${colors.text}`}>{testType}</span>
        </div>
        <div className="text-center py-4">
          <span className="text-txt-tertiary text-sm">No tests yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-semibold ${colors.text}`}>{testType}</span>
        <span className="text-xs text-txt-tertiary">{formatDate(pb.date)}</span>
      </div>

      {/* Time - prominently displayed */}
      <div className="mb-3">
        <div className="text-2xl font-mono font-bold text-txt-primary">
          {formatTime(pb.timeSeconds)}
        </div>
      </div>

      {/* Secondary info */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-bdr-subtle">
        <div>
          <div className="text-xs text-txt-tertiary mb-1">Split</div>
          <div className="text-sm font-mono text-txt-secondary">
            {formatSplit(pb.splitSeconds)}
          </div>
        </div>
        <div>
          <div className="text-xs text-txt-tertiary mb-1">Watts</div>
          <div className="text-sm font-mono text-txt-secondary">
            {pb.watts ? Math.round(pb.watts) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card displaying athlete's personal bests by test type
 */
export function PersonalBestsCard({
  personalBests,
  testTypes = ['2k', '6k', '30min', '500m'],
  className = ''
}: PersonalBestsCardProps) {
  return (
    <div className={`bg-card-bg rounded-lg border border-card-border shadow-card ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-bdr-subtle">
        <h3 className="text-sm font-semibold text-txt-primary">Personal Bests</h3>
      </div>

      {/* Grid of test types */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {testTypes.map((testType) => (
            <PersonalBestItem
              key={testType}
              testType={testType}
              pb={personalBests[testType]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PersonalBestsCard;
