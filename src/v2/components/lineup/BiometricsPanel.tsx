import { useMemo } from 'react';
import useLineupStore from '@/store/lineupStore';
import {
  calculateBoatBiometrics,
  calculateTotalBiometrics,
  formatSplit,
  formatWeight,
  formatHeight,
  type BiometricsStats,
} from '@v2/utils/biometricsCalculations';

/**
 * Props for BiometricsPanel
 */
interface BiometricsPanelProps {
  className?: string;
}

/**
 * BiometricsPanel - Live biometrics display for lineup builder
 *
 * Features:
 * - Shows average weight, height, and 2k split for assigned athletes
 * - Updates automatically when athletes are assigned/removed (subscribes to activeBoats)
 * - Displays per-boat stats (if multiple boats) and total stats
 * - Handles missing data gracefully (shows "--" for unavailable metrics)
 *
 * Per RESEARCH.md:
 * "Separate panel (less cluttered). Update on drag end (not during drag). Show per-boat and total."
 *
 * Per LINE-12 requirement:
 * "System displays average biometrics as lineup is built"
 */
export function BiometricsPanel({ className = '' }: BiometricsPanelProps) {
  const activeBoats = useLineupStore((state) => state.activeBoats);

  // Calculate biometrics - useMemo prevents recalculation during drag
  const { perBoatStats, totalStats } = useMemo(() => {
    const perBoatStats = activeBoats
      .map((boat) => ({
        boatId: boat.id,
        boatName: boat.name,
        shellName: boat.shellName,
        stats: calculateBoatBiometrics(boat),
      }))
      .filter((b) => b.stats !== null);

    const totalStats = calculateTotalBiometrics(activeBoats);

    return { perBoatStats, totalStats };
  }, [activeBoats]);

  // Empty state
  if (!totalStats) {
    return (
      <div className={`bg-bg-surface border border-bdr-default rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <p className="text-sm text-txt-tertiary">No athletes assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-surface border border-bdr-default rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-txt-primary">Lineup Biometrics</h3>
        <span className="text-xs text-txt-tertiary">
          {totalStats.athleteCount} athlete{totalStats.athleteCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {/* Total Stats - Always show */}
        {perBoatStats.length > 1 && (
          <div className="pb-3 border-b border-bdr-default">
            <div className="text-xs font-medium text-txt-secondary mb-2">Total</div>
            <BiometricsRow stats={totalStats} />
          </div>
        )}

        {/* Per-boat stats - Only show if multiple boats */}
        {perBoatStats.length > 1 && (
          <div className="space-y-2">
            {perBoatStats.map((boat) => (
              <div key={boat.boatId}>
                <div className="text-xs font-medium text-txt-secondary mb-1">
                  {boat.boatName}
                  {boat.shellName && <span className="text-txt-tertiary"> - {boat.shellName}</span>}
                </div>
                <BiometricsRow stats={boat.stats!} compact />
              </div>
            ))}
          </div>
        )}

        {/* Single boat - Show total only */}
        {perBoatStats.length === 1 && <BiometricsRow stats={totalStats} />}
      </div>
    </div>
  );
}

/**
 * BiometricsRow - Display row of biometric stats
 */
interface BiometricsRowProps {
  stats: BiometricsStats;
  compact?: boolean;
}

function BiometricsRow({ stats, compact = false }: BiometricsRowProps) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-3'}`}>
      {/* Weight */}
      <BiometricStat
        label="Weight"
        value={formatWeight(stats.avgWeight)}
        range={
          stats.minWeight && stats.maxWeight
            ? `${stats.minWeight.toFixed(0)}-${stats.maxWeight.toFixed(0)} kg`
            : undefined
        }
        compact={compact}
      />

      {/* Height */}
      <BiometricStat
        label="Height"
        value={formatHeight(stats.avgHeight)}
        range={
          stats.minHeight && stats.maxHeight
            ? `${Math.round(stats.minHeight)}-${Math.round(stats.maxHeight)} cm`
            : undefined
        }
        compact={compact}
      />

      {/* 2k Split */}
      <BiometricStat
        label="2k Avg"
        value={formatSplit(stats.avg2k)}
        range={
          stats.fastest2k && stats.slowest2k
            ? `${formatSplit(stats.fastest2k)} - ${formatSplit(stats.slowest2k)}`
            : undefined
        }
        compact={compact}
      />
    </div>
  );
}

/**
 * BiometricStat - Individual stat display
 */
interface BiometricStatProps {
  label: string;
  value: string;
  range?: string;
  compact?: boolean;
}

function BiometricStat({ label, value, range, compact = false }: BiometricStatProps) {
  return (
    <div>
      <div className="text-xs text-txt-tertiary mb-0.5">{label}</div>
      <div className={`${compact ? 'text-sm' : 'text-base'} font-medium text-txt-primary`}>
        {value}
      </div>
      {range && !compact && (
        <div className="text-xs text-txt-tertiary mt-0.5">Range: {range}</div>
      )}
    </div>
  );
}

export default BiometricsPanel;
