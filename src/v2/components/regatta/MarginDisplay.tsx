import { useState, useMemo } from 'react';
import type { MarginDisplayMode } from '../../types/regatta';
import { formatMarginExact, getMarginInfo } from '../../utils/marginCalculations';

type MarginDisplayProps = {
  marginSeconds: number | null;
  distanceMeters?: number;
  winnerTimeSeconds?: number;
  boatClass?: string;
  defaultMode?: MarginDisplayMode;
  showToggle?: boolean;
  className?: string;
};

export function MarginDisplay({
  marginSeconds,
  distanceMeters = 2000,
  winnerTimeSeconds,
  boatClass = '8+',
  defaultMode = 'terminology',
  showToggle = true,
  className = '',
}: MarginDisplayProps) {
  const [mode, setMode] = useState<MarginDisplayMode>(defaultMode);

  const marginInfo = useMemo(() => {
    if (marginSeconds === null || marginSeconds === undefined) return null;
    if (!winnerTimeSeconds || winnerTimeSeconds <= 0) {
      // Can't calculate terminology without speed, show exact only
      return { seconds: marginSeconds, boatLengths: 0, terminology: formatMarginExact(marginSeconds) };
    }
    return getMarginInfo(marginSeconds, distanceMeters, winnerTimeSeconds, boatClass);
  }, [marginSeconds, distanceMeters, winnerTimeSeconds, boatClass]);

  if (!marginInfo) {
    return <span className={`text-txt-tertiary ${className}`}>—</span>;
  }

  const displayValue = mode === 'terminology' ? marginInfo.terminology : formatMarginExact(marginInfo.seconds);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-txt-primary">{displayValue}</span>
      {showToggle && winnerTimeSeconds && (
        <button
          type="button"
          onClick={() => setMode(m => (m === 'terminology' ? 'exact' : 'terminology'))}
          className="text-xs text-txt-tertiary hover:text-txt-secondary transition-colors"
          title={mode === 'terminology' ? 'Show exact time' : 'Show terminology'}
        >
          ({mode === 'terminology' ? formatMarginExact(marginInfo.seconds) : marginInfo.terminology})
        </button>
      )}
    </span>
  );
}

// Compact version for tables
export function MarginBadge({
  marginSeconds,
  distanceMeters = 2000,
  winnerTimeSeconds,
  boatClass = '8+',
}: Omit<MarginDisplayProps, 'defaultMode' | 'showToggle' | 'className'>) {
  const marginInfo = useMemo(() => {
    if (marginSeconds === null || marginSeconds === undefined || marginSeconds === 0) return null;
    if (!winnerTimeSeconds) return { terminology: formatMarginExact(marginSeconds) };
    return getMarginInfo(marginSeconds, distanceMeters, winnerTimeSeconds, boatClass);
  }, [marginSeconds, distanceMeters, winnerTimeSeconds, boatClass]);

  if (!marginInfo) return null;

  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded bg-ink-raised text-txt-secondary"
      title={`${marginInfo.seconds?.toFixed(2) || marginSeconds}s`}
    >
      +{marginInfo.terminology}
    </span>
  );
}
