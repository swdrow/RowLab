import { AthleteAvatar } from './AthleteAvatar';
import { getCountryFlag } from '@v2/utils/countryFlags';
import type { Athlete } from '@v2/types/athletes';

export interface AthleteCardProps {
  athlete: Athlete;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

/**
 * Format biometric value with unit
 */
function formatBiometric(value: number | null, unit: string): string {
  if (value === null) return '—';
  return `${value}${unit}`;
}

/**
 * Side preference color indicator
 */
function SideIndicator({ side }: { side: Athlete['side'] }) {
  if (!side) return null;

  const colors = {
    Port: 'bg-red-500',
    Starboard: 'bg-green-500',
    Both: 'bg-blue-500',
    Cox: 'bg-purple-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[side]}`} />
      <span className="text-sm text-txt-secondary">{side}</span>
    </div>
  );
}

export function AthleteCard({
  athlete,
  onClick,
  isSelected = false,
  className = '',
}: AthleteCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        group p-4 rounded-xl border transition-all
        ${onClick ? 'cursor-pointer' : ''}
        ${
          isSelected
            ? 'border-accent-copper bg-accent-copper/[0.06]'
            : 'border-ink-border bg-bg-surface hover:border-accent-copper/30 hover:bg-accent-copper/[0.02]'
        }
        ${className}
      `}
    >
      {/* Header with Avatar and Name */}
      <div className="flex items-start gap-3 mb-4">
        <AthleteAvatar firstName={athlete.firstName} lastName={athlete.lastName} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-txt-primary truncate flex items-center gap-2">
            <span>
              {athlete.firstName} {athlete.lastName}
            </span>
            {athlete.country && (
              <span title={athlete.country}>{getCountryFlag(athlete.country)}</span>
            )}
          </h3>
          {athlete.email && <p className="text-sm text-txt-tertiary truncate">{athlete.email}</p>}
        </div>
      </div>

      {/* Side Preference */}
      <div className="mb-3">
        <SideIndicator side={athlete.side} />
      </div>

      {/* Capabilities */}
      <div className="flex gap-2 mb-4">
        {athlete.canScull && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-bg-active text-txt-primary">
            Scull
          </span>
        )}
        {athlete.canCox && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-bg-active text-txt-primary">
            Cox
          </span>
        )}
        {!athlete.canScull && !athlete.canCox && (
          <span className="text-sm text-txt-tertiary">No capabilities</span>
        )}
      </div>

      {/* Biometrics */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-bdr-subtle">
        <div>
          <div className="text-xs text-txt-tertiary mb-1">Weight</div>
          <div className="text-sm font-medium text-txt-secondary">
            {formatBiometric(athlete.weightKg, 'kg')}
          </div>
        </div>
        <div>
          <div className="text-xs text-txt-tertiary mb-1">Height</div>
          <div className="text-sm font-medium text-txt-secondary">
            {formatBiometric(athlete.heightCm, 'cm')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AthleteCard;
