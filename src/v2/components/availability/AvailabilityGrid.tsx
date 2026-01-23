import { AvailabilityCell } from './AvailabilityCell';
import type { AthleteAvailability, AvailabilitySlot } from '../../types/coach';

interface AvailabilityGridProps {
  athletes: AthleteAvailability[];
  dates: Date[];
  onCellClick?: (athleteId: string, date: Date) => void;
}

/**
 * SideBadge - Display athlete's rowing side preference
 */
function SideBadge({ side }: { side: string | null }) {
  if (!side) return null;

  const sideMap: Record<string, { label: string; color: string }> = {
    Port: { label: 'P', color: 'bg-status-info/20 text-status-info' },
    Starboard: { label: 'S', color: 'bg-status-success/20 text-status-success' },
    Both: { label: 'B', color: 'bg-status-warning/20 text-status-warning' },
    Cox: { label: 'C', color: 'bg-interactive-primary/20 text-interactive-primary' },
  };

  const sideInfo = sideMap[side];
  if (!sideInfo) return null;

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${sideInfo.color}`}>
      {sideInfo.label}
    </span>
  );
}

/**
 * BiometricBadge - Display small capability badge (Sc for scull, Cx for cox)
 */
function BiometricBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-bg-hover text-text-secondary">
      {label}
    </span>
  );
}

/**
 * AvailabilityGrid - Team-wide availability matrix
 *
 * Features:
 * - CSS Grid layout with sticky first column
 * - Biometrics display (side, scull capability, cox capability)
 * - Dynamic columns based on date range
 * - Color-coded cells via AvailabilityCell
 */
export function AvailabilityGrid({ athletes, dates, onCellClick }: AvailabilityGridProps) {
  // Helper to get slot for a specific date
  const getSlot = (athlete: AthleteAvailability, date: Date): { morning: AvailabilitySlot; evening: AvailabilitySlot } => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = athlete.dates.find(d => d.date === dateStr);
    return {
      morning: dayData?.morningSlot || 'NOT_SET',
      evening: dayData?.eveningSlot || 'NOT_SET',
    };
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `200px repeat(${dates.length}, minmax(100px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="sticky left-0 bg-bg-surface font-semibold text-text-primary p-2 border-b border-border-default z-10">
          Athlete
        </div>
        {dates.map((date) => (
          <div
            key={date.toISOString()}
            className="font-semibold text-text-primary text-center p-2 border-b border-border-default"
          >
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        ))}

        {/* Athlete rows */}
        {athletes.map((athlete) => (
          <>
            {/* Athlete name + biometrics (sticky column) */}
            <div
              key={`${athlete.athleteId}-name`}
              className="sticky left-0 bg-bg-surface p-2 border-b border-border-subtle flex items-center gap-2 z-10"
            >
              <span className="text-text-primary font-medium truncate">{athlete.athleteName}</span>
              <div className="flex items-center gap-1">
                <SideBadge side={athlete.side} />
                {athlete.canScull && <BiometricBadge label="Sc" />}
                {athlete.canCox && <BiometricBadge label="Cx" />}
              </div>
            </div>

            {/* Availability cells for each date */}
            {dates.map((date) => {
              const slots = getSlot(athlete, date);
              return (
                <div
                  key={`${athlete.athleteId}-${date.toISOString()}`}
                  className="p-1 border-b border-border-subtle"
                >
                  <AvailabilityCell
                    morningSlot={slots.morning}
                    eveningSlot={slots.evening}
                    onClick={() => onCellClick?.(athlete.athleteId, date)}
                  />
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
