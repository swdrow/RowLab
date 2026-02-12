/**
 * RowLab Logo Mark — "The Sweep"
 *
 * Abstract R inspired by sweep rowing. Use this component anywhere
 * a logo mark is needed. For the full wordmark lockup, see RowLabWordmark.
 *
 * Props:
 *   size      — px dimension for the square container (default: 32)
 *   className — additional classes for the <svg> element
 *   title     — accessible title override (default: "RowLab")
 */

interface RowLabLogoProps {
  size?: number;
  className?: string;
  title?: string;
}

export function RowLabLogo({ size = 32, className = '', title = 'RowLab' }: RowLabLogoProps) {
  const w = size;
  const h = Math.round(size * (105 / 80));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 105"
      width={w}
      height={h}
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>

      <defs>
        {/* Warm copper gradient along the stroke's diagonal axis */}
        <linearGradient id="rl-sweepGrad" x1="13" y1="4" x2="62" y2="97" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#f5d070" />
          <stop offset="40%"  stopColor="#c07830" />
          <stop offset="100%" stopColor="#7c3d10" />
        </linearGradient>

        {/* Water ripple: blue, fades at both ends */}
        <linearGradient id="rl-waterGrad" x1="44" y1="0" x2="68" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0070f3" stopOpacity="0" />
          <stop offset="30%"  stopColor="#0070f3" stopOpacity="0.7" />
          <stop offset="70%"  stopColor="#0070f3" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0070f3" stopOpacity="0" />
        </linearGradient>

        {/* Subtle glow */}
        <filter id="rl-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/*
        Main R — single continuous monoline path
        Segments:
          1. M 13,92            bottom of left spine
          2. C 14,72 12,48 12,15   up the vertical (slight organic lean)
          3. C 14,7  21,4  31,4    curving into the upper arc
          4. C 46,4  56,14 54,28   outer bulge of the R bow
          5. C 52,42 42,52 28,55   inner arc returning inward
          6. C 20,57 14,58 12,59   settling at the junction
          7. C 20,70 39,83 62,97   diagonal leg — the oar shaft
      */}
      <path
        d={[
          'M 13,92',
          'C 14,72 12,48 12,15',
          'C 14,7  21,4  31,4',
          'C 46,4  56,14 54,28',
          'C 52,42 42,52 28,55',
          'C 20,57 14,58 12,59',
          'C 20,70 39,83 62,97',
        ].join(' ')}
        fill="none"
        stroke="url(#rl-sweepGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#rl-glow)"
      />

      {/*
        Oar blade — spoon shape perpendicular to the shaft at the catch entry
        Shaft direction: (12,59)→(62,97) ≈ 37° below horizontal
        Blade perpendicular: rotate(127)
      */}
      <g transform="translate(62,97) rotate(127)">
        <path
          d="M -9,0 C -8,-3.5 -2,-5 0,-5 C 2,-5 8,-3.5 9,0 C 8,3.5 2,5 0,5 C -2,5 -8,3.5 -9,0 Z"
          fill="#7c3d10"
          opacity="0.92"
        />
        {/* Blade highlight sheen */}
        <path
          d="M -6,-1 C -4,-3 4,-3 6,-1"
          fill="none"
          stroke="#f5d070"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>

      {/* Water ripple — two arcs at the blade entry */}
      <path
        d="M 44,101 Q 53,98 64,101"
        fill="none"
        stroke="url(#rl-waterGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M 47,104 Q 55,101 63,104"
        fill="none"
        stroke="url(#rl-waterGrad)"
        strokeWidth="1.0"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
