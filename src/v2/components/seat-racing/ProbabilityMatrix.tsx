import { useMemo } from 'react';
import { useProbabilityMatrix } from '../../hooks/useAdvancedRankings';

interface ProbabilityMatrixProps {
  onCellClick?: (athlete1Id: string, athlete2Id: string, probability: number) => void;
  maxSize?: number; // Limit matrix size for readability
}

export function ProbabilityMatrix({ onCellClick, maxSize = 15 }: ProbabilityMatrixProps) {
  const { matrix, athletes, isLoading, error } = useProbabilityMatrix();

  // Get CSS variable colors for theme awareness
  const chartColors = useMemo(
    () => ({
      good: getComputedStyle(document.documentElement).getPropertyValue('--data-good').trim(),
      poor: getComputedStyle(document.documentElement).getPropertyValue('--data-poor').trim(),
    }),
    []
  );

  // Limit to maxSize athletes (top ranked)
  const displayData = useMemo(() => {
    const displayAthletes = athletes.slice(0, maxSize);
    const displayMatrix = matrix.slice(0, maxSize).map((row) => row.slice(0, maxSize));
    return { athletes: displayAthletes, matrix: displayMatrix };
  }, [matrix, athletes, maxSize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-bg-surface rounded-lg">
        <div className="text-txt-secondary">Loading probability matrix...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-bg-surface rounded-lg">
        <div style={{ color: chartColors.poor }}>Failed to load probability matrix</div>
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-bg-surface rounded-lg">
        <div className="text-txt-secondary">No comparison data available</div>
      </div>
    );
  }

  const { athletes: displayAthletes, matrix: displayMatrix } = displayData;

  return (
    <div className="space-y-4">
      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-txt-secondary bg-bg-surface sticky left-0 z-10">
                P(row beats col)
              </th>
              {displayAthletes.map((athlete) => (
                <th
                  key={athlete.id}
                  className="p-1 text-center text-xs font-medium text-txt-secondary bg-bg-surface"
                  style={{ minWidth: '60px' }}
                >
                  <div className="truncate" title={`${athlete.firstName} ${athlete.lastName}`}>
                    {athlete.firstName?.[0]}
                    {athlete.lastName?.[0] || ''}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayAthletes.map((rowAthlete, rowIdx) => (
              <tr key={rowAthlete.id}>
                <td className="p-2 text-xs font-medium text-txt-primary bg-bg-surface sticky left-0 z-10 whitespace-nowrap">
                  {rowAthlete.firstName} {rowAthlete.lastName?.[0]}.
                </td>
                {displayMatrix[rowIdx]?.map((probability, colIdx) => (
                  <td
                    key={colIdx}
                    className="p-1 text-center cursor-pointer transition-all"
                    style={{
                      backgroundColor: getCellColor(probability, rowIdx === colIdx, chartColors),
                      transitionProperty: 'background-color',
                      transitionDuration: '0.3s',
                      transitionTimingFunction: 'ease-out',
                    }}
                    onClick={() => {
                      if (rowIdx !== colIdx && onCellClick) {
                        onCellClick(
                          displayAthletes[rowIdx].id,
                          displayAthletes[colIdx].id,
                          probability
                        );
                      }
                    }}
                    title={
                      rowIdx === colIdx
                        ? 'Self'
                        : `P(${rowAthlete.firstName} beats ${displayAthletes[colIdx].firstName}) = ${(probability * 100).toFixed(0)}%`
                    }
                  >
                    <span
                      className="text-xs font-mono"
                      style={{ color: getTextColor(probability) }}
                    >
                      {rowIdx === colIdx ? '—' : `${(probability * 100).toFixed(0)}`}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-txt-secondary">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getCellColor(0.2, false, chartColors) }}
          />
          <span>20% (unlikely to win)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getCellColor(0.5, false, chartColors) }}
          />
          <span>50% (toss-up)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getCellColor(0.8, false, chartColors) }}
          />
          <span>80% (likely to win)</span>
        </div>
      </div>

      {/* Truncation notice */}
      {athletes.length > maxSize && (
        <p className="text-center text-xs text-txt-secondary">
          Showing top {maxSize} athletes. Full roster has {athletes.length} athletes.
        </p>
      )}
    </div>
  );
}

/**
 * Get cell background color based on probability
 * Uses blue-orange diverging scale refined for V3 warm palette
 * 0.5 = neutral (toss-up), <0.5 = blue (likely to lose), >0.5 = orange (likely to win)
 */
function getCellColor(
  probability: number,
  isDiagonal: boolean,
  chartColors: { good: string; poor: string }
): string {
  if (isDiagonal) return 'var(--ink-raised)'; // V3 neutral for diagonal

  // Parse RGB values from CSS variables for gradients
  const blueMatch = chartColors.good.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const orangeMatch = chartColors.poor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  // Fallback to default if parsing fails
  const blueRGB = blueMatch ? `${blueMatch[1]}, ${blueMatch[2]}, ${blueMatch[3]}` : '59, 130, 246';
  const orangeRGB = orangeMatch
    ? `${orangeMatch[1]}, ${orangeMatch[2]}, ${orangeMatch[3]}`
    : '249, 115, 22';

  // Diverging color scale with warm refinements
  if (probability < 0.5) {
    // Blue scale (losing probability) - shift toward teal for warmth
    const intensity = (0.5 - probability) * 2; // 0 at 0.5, 1 at 0
    return `rgba(${blueRGB}, ${0.1 + intensity * 0.5})`;
  } else {
    // Orange scale (winning probability) - shift toward amber for warmth
    const intensity = (probability - 0.5) * 2; // 0 at 0.5, 1 at 1.0
    return `rgba(${orangeRGB}, ${0.1 + intensity * 0.5})`;
  }
}

/**
 * Get text color for contrast (WCAG AA compliance)
 */
function getTextColor(probability: number): string {
  if (probability < 0.3 || probability > 0.7) {
    return 'var(--ink-bright)'; // High contrast for extreme probabilities
  }
  return 'var(--ink-primary)'; // V3 primary text for mid-range
}

export default ProbabilityMatrix;
