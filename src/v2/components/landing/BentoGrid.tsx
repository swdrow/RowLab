import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * BentoGrid - Asymmetric grid for feature showcase
 *
 * Layout (desktop):
 * +-------------+-------+-------+
 * |   LARGE     |  MED  |  MED  |
 * |  (lineup)   |(seat) |(train)|
 * +-------+-----+-------+-------+
 * | SMALL |SMALL|    MEDIUM     |
 * | (erg) |(fleet)|  (race day) |
 * +-------+-----+-------+-------+
 * |   SMALL     | SMALL | SMALL |
 * |  (avail)    |(roster)|(gamify)|
 * +-------------+-------+-------+
 *
 * Mobile: Single column stack
 */
export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        grid gap-4
        grid-cols-1
        md:grid-cols-4
        lg:grid-cols-6
        ${className}
      `}
      style={{
        gridTemplateAreas: `
          "lineup lineup lineup seat seat train"
          "lineup lineup lineup seat seat train"
          "erg erg fleet raceday raceday raceday"
          "avail avail roster roster gamify gamify"
        `,
      }}
    >
      {children}
    </div>
  );
};

// Export grid area names for tile assignment
export const GRID_AREAS = {
  lineup: 'lineup',
  seat: 'seat',
  train: 'train',
  erg: 'erg',
  fleet: 'fleet',
  raceday: 'raceday',
  avail: 'avail',
  roster: 'roster',
  gamify: 'gamify',
} as const;

export default BentoGrid;
