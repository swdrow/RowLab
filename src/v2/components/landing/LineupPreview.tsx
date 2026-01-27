import React from 'react';

/**
 * LineupPreview - Visual preview of lineup builder for landing page
 *
 * Shows a simplified 4+ boat diagram with seat slots and an athlete
 * being "dragged" into position. Uses SVG for crisp rendering.
 */
export const LineupPreview: React.FC = () => {
  return (
    <div className="relative w-full h-32 bg-ink-base/50 rounded-lg overflow-hidden">
      {/* Boat outline - simplified 4+ shell */}
      <svg
        viewBox="0 0 300 60"
        className="absolute inset-0 w-full h-full p-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {/* Hull */}
        <path
          d="M10 30 Q30 10, 150 10 Q270 10, 290 30 Q270 50, 150 50 Q30 50, 10 30"
          className="stroke-ink-border fill-ink-raised/50"
        />

        {/* Seat slots */}
        <g className="fill-ink-base stroke-ink-border">
          {/* Bow */}
          <rect x="50" y="20" width="30" height="20" rx="3" />
          {/* 2 seat */}
          <rect x="90" y="20" width="30" height="20" rx="3" />
          {/* 3 seat */}
          <rect x="130" y="20" width="30" height="20" rx="3" className="fill-ink-bright/20 stroke-ink-primary" />
          {/* Stroke */}
          <rect x="170" y="20" width="30" height="20" rx="3" />
          {/* Cox */}
          <circle cx="230" cy="30" r="12" />
        </g>

        {/* "Dragged" athlete indicator */}
        <g className="animate-pulse">
          <rect
            x="130" y="20" width="30" height="20" rx="3"
            className="fill-ink-bright/30 stroke-ink-bright"
            strokeDasharray="4 2"
          />
        </g>

        {/* Seat numbers */}
        <g className="fill-ink-secondary text-xs" fontSize="8">
          <text x="65" y="34" textAnchor="middle">B</text>
          <text x="105" y="34" textAnchor="middle">2</text>
          <text x="145" y="34" textAnchor="middle">3</text>
          <text x="185" y="34" textAnchor="middle">S</text>
          <text x="230" y="34" textAnchor="middle">C</text>
        </g>
      </svg>

      {/* Floating "athlete card" being dragged */}
      <div
        className="absolute top-2 right-4 px-2 py-1 bg-ink-bright text-ink-deep text-xs font-medium rounded shadow-lg"
        style={{ transform: 'rotate(-3deg)' }}
      >
        J. Smith
      </div>
    </div>
  );
};

export default LineupPreview;
