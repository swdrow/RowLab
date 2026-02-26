/**
 * CosmicAtmosphere — oarbit's signature background layer.
 *
 * Renders the fixed cosmic void atmosphere behind all content:
 * vignette, nebula drift, film grain, twinkling stars, shooting comets.
 *
 * The starfield (135 box-shadow stars on body::before) is handled in app.css.
 * All elements are position:fixed, pointer-events:none, aria-hidden.
 * Respects prefers-reduced-motion.
 */

const SMALL_STAR_COUNT = 6;
const LARGE_STAR_COUNT = 14;
const COMET_COUNT = 4;

export function CosmicAtmosphere() {
  return (
    <>
      {/* Vignette — darkened corners */}
      <div className="vignette" aria-hidden="true" />

      {/* Nebula drift layers */}
      <div className="nebula-1" aria-hidden="true" />
      <div className="nebula-2" aria-hidden="true" />

      {/* Film grain (SVG feTurbulence) */}
      <div className="film-grain-wrap" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
        >
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves={4}
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0.8 0.1 0.05 0 0.05 0.1 0.7 0.05 0 0.05 0.05 0.05 0.6 0 0.05 0 0 0 0.3 0"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* Small twinkling stars (6) */}
      {Array.from({ length: SMALL_STAR_COUNT }, (_, i) => (
        <div key={`ts-${i}`} className={`twinkle-star twinkle-star-${i + 1}`} aria-hidden="true" />
      ))}

      {/* Large twinkling stars (14) */}
      {Array.from({ length: LARGE_STAR_COUNT }, (_, i) => (
        <div key={`tl-${i}`} className={`twinkle-star-lg twinkle-lg-${i + 1}`} aria-hidden="true" />
      ))}

      {/* Shooting stars (4) — rotated field creates diagonal movement */}
      <div className="shooting-star-field" aria-hidden="true">
        {Array.from({ length: COMET_COUNT }, (_, i) => (
          <div key={`sc-${i}`} className={`shooting-star shooting-star-${i + 1}`} />
        ))}
      </div>
    </>
  );
}
