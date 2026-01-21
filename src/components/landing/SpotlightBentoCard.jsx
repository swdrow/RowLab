import { useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * SpotlightBentoCard - Feature card with mouse-following spotlight
 * Chronicle/Linear style
 */
export function SpotlightBentoCard({
  children,
  className,
  spotlightColor = 'rgba(0, 112, 243, 0.08)',
  backgroundImage,
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e) {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
    mouseX.set(x);
    mouseY.set(y);
  }

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={clsx(
        'group relative min-h-[280px] p-8 overflow-hidden',
        'rounded-2xl',
        // Glass card styling
        'bg-white/[0.02] backdrop-blur-xl',
        'border border-white/10 hover:border-white/15',
        'shadow-card hover:shadow-card-hover',
        'transition-all duration-150 ease-out',
        className
      )}
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Top Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100" />

      {/* Background texture image (boathouse photo) */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.08] grayscale contrast-[1.2] mix-blend-luminosity transition-opacity duration-100 group-hover:opacity-[0.12]"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-100"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/**
 * BentoGrid container with Chronicle-style asymmetric layout
 */
export function BentoGrid({ children, className }) {
  return (
    <div
      className={clsx(
        'grid grid-cols-12 gap-4',
        // Mobile: single column
        'max-md:grid-cols-1 max-md:[&>*]:col-span-1',
        className
      )}
    >
      {children}
    </div>
  );
}

// Grid span utilities for bento cards
export const bentoSpans = {
  heroFeature: 'col-span-7 row-span-2 min-h-[560px] max-md:col-span-1 max-md:row-span-1 max-md:min-h-[320px]',
  mediumTop: 'col-span-5 max-md:col-span-1',
  mediumBottom: 'col-span-5 max-md:col-span-1',
  wide: 'col-span-8 max-md:col-span-1',
  narrow: 'col-span-4 max-md:col-span-1',
  half: 'col-span-6 max-md:col-span-1',
  third: 'col-span-4 max-md:col-span-1',
  full: 'col-span-12 max-md:col-span-1',
};

export default SpotlightBentoCard;
