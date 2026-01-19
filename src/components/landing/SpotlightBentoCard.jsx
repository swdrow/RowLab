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
  spotlightColor = 'rgba(0, 229, 153, 0.08)',
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
        'rounded-[20px] isolate',
        // Gradient stroke border
        'border border-transparent',
        '[background-image:linear-gradient(rgba(18,18,20,0.85),rgba(18,18,20,0.85)),linear-gradient(to_bottom,rgba(255,255,255,0.1),rgba(255,255,255,0))]',
        '[background-origin:padding-box,border-box]',
        '[background-clip:padding-box,border-box]',
        'transition-all duration-300 ease-out',
        'hover:translate-y-[-4px] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Background texture image (boathouse photo) */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-[-2] bg-cover bg-center opacity-[0.08] grayscale contrast-[1.2] mix-blend-luminosity transition-opacity duration-400 group-hover:opacity-[0.12]"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute inset-0 z-[-1] transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />

      {children}
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
