// src/v2/components/training/periodization/PeriodizationTimeline.tsx

import React, { useMemo } from 'react';
import { format, parseISO, differenceInDays, differenceInWeeks, isWithinInterval } from 'date-fns';
import { getPeriodizationColor } from '../../../utils/calendarHelpers';
import type { PeriodizationBlock, PeriodizationPhase } from '../../../types/training';

interface PeriodizationTimelineProps {
  blocks: PeriodizationBlock[];
  startDate: Date;
  endDate: Date;
  onBlockClick?: (block: PeriodizationBlock) => void;
  onAddBlock?: (startDate: Date) => void;
  className?: string;
}

const phaseLabels: Record<PeriodizationPhase, string> = {
  base: 'Base',
  build: 'Build',
  peak: 'Peak',
  taper: 'Taper',
};

const phaseIcons: Record<PeriodizationPhase, string> = {
  base: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  build: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  peak: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  taper: 'M19 14l-7 7m0 0l-7-7m7 7V3',
};

/**
 * Visual timeline showing periodization blocks.
 * Displays base, build, peak, and taper phases with their date ranges.
 */
export function PeriodizationTimeline({
  blocks,
  startDate,
  endDate,
  onBlockClick,
  onAddBlock,
  className = '',
}: PeriodizationTimelineProps) {
  const totalDays = differenceInDays(endDate, startDate);

  // Calculate position and width for each block
  const positionedBlocks = useMemo(() => {
    return blocks.map((block) => {
      const blockStart = parseISO(block.startDate);
      const blockEnd = parseISO(block.endDate);
      const startOffset = differenceInDays(blockStart, startDate);
      const duration = differenceInDays(blockEnd, blockStart);
      const weeks = differenceInWeeks(blockEnd, blockStart);

      return {
        ...block,
        left: (startOffset / totalDays) * 100,
        width: (duration / totalDays) * 100,
        weeks,
      };
    });
  }, [blocks, startDate, endDate, totalDays]);

  // Check if there are gaps in the timeline
  const today = new Date();
  const isInBlock = blocks.some((block) =>
    isWithinInterval(today, {
      start: parseISO(block.startDate),
      end: parseISO(block.endDate),
    })
  );

  return (
    <div className={`periodization-timeline ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-txt-primary">Training Phases</h3>
        {onAddBlock && (
          <button
            onClick={() => onAddBlock(today)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                       text-accent-primary hover:text-accent-primary-hover
                       transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Phase
          </button>
        )}
      </div>

      {/* Timeline container */}
      <div className="relative">
        {/* Date labels */}
        <div className="flex justify-between text-xs text-txt-tertiary mb-2">
          <span>{format(startDate, 'MMM d, yyyy')}</span>
          <span>{format(endDate, 'MMM d, yyyy')}</span>
        </div>

        {/* Timeline track */}
        <div className="relative h-16 bg-surface-elevated rounded-lg border border-bdr-default overflow-hidden">
          {/* Background grid (weeks) */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-bdr-default/30 last:border-r-0"
              />
            ))}
          </div>

          {/* Blocks */}
          {positionedBlocks.map((block) => (
            <button
              key={block.id}
              onClick={() => onBlockClick?.(block)}
              className="absolute top-1 bottom-1 rounded-md transition-all
                         hover:ring-2 hover:ring-white/30 hover:scale-[1.02]
                         focus:outline-none focus:ring-2 focus:ring-accent-primary"
              style={{
                left: `${block.left}%`,
                width: `${block.width}%`,
                backgroundColor: block.color || getPeriodizationColor(block.phase),
              }}
              title={`${phaseLabels[block.phase]}: ${format(parseISO(block.startDate), 'MMM d')} - ${format(parseISO(block.endDate), 'MMM d')}`}
            >
              <div className="h-full flex flex-col justify-center px-2 text-white">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={phaseIcons[block.phase]} />
                  </svg>
                  <span className="text-xs font-semibold truncate">
                    {phaseLabels[block.phase]}
                  </span>
                </div>
                {block.weeks >= 2 && (
                  <span className="text-[10px] opacity-80 truncate">
                    {block.weeks}w
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Today indicator */}
          {isWithinInterval(today, { start: startDate, end: endDate }) && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent-destructive z-10"
              style={{
                left: `${(differenceInDays(today, startDate) / totalDays) * 100}%`,
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-destructive rounded-full" />
            </div>
          )}
        </div>

        {/* Current phase indicator */}
        {isInBlock && (
          <div className="mt-2 text-xs text-txt-secondary">
            Currently in:{' '}
            <span className="font-medium text-txt-primary">
              {blocks.find((b) =>
                isWithinInterval(today, {
                  start: parseISO(b.startDate),
                  end: parseISO(b.endDate),
                })
              )?.name || 'Active Phase'}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {(['base', 'build', 'peak', 'taper'] as PeriodizationPhase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getPeriodizationColor(phase) }}
            />
            <span className="text-xs text-txt-secondary">{phaseLabels[phase]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PeriodizationTimeline;
