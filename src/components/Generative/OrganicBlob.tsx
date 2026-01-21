import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

interface OrganicBlobProps {
  /** Color of the blob (CSS color value) */
  color?: string;
  /** Size in pixels */
  size?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Blur amount in pixels */
  blur?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OrganicBlob - A morphing, organic shape for backgrounds
 * Uses CSS border-radius animation for smooth, performant morphing
 * No external dependencies - pure Framer Motion + CSS
 */
export function OrganicBlob({
  color = 'rgba(0, 112, 243, 0.5)',
  size = 300,
  duration = 10,
  blur = 60,
  opacity = 0.5,
  className = '',
}: OrganicBlobProps) {
  const shouldReduceMotion = useReducedMotion();

  // Predefined border-radius keyframes for organic morphing
  const borderRadiusKeyframes = useMemo(
    () => [
      '60% 40% 30% 70% / 60% 30% 70% 40%',
      '30% 60% 70% 40% / 50% 60% 30% 60%',
      '50% 50% 40% 60% / 40% 60% 50% 50%',
      '40% 60% 50% 50% / 60% 40% 60% 40%',
      '60% 40% 30% 70% / 60% 30% 70% 40%',
    ],
    []
  );

  // Static fallback for reduced motion
  if (shouldReduceMotion) {
    return (
      <div
        className={`absolute pointer-events-none ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          filter: `blur(${blur}px)`,
          opacity,
          borderRadius: '50%',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        filter: `blur(${blur}px)`,
        opacity,
      }}
      animate={{
        borderRadius: borderRadiusKeyframes,
        scale: [1, 1.02, 0.98, 1.01, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

export default OrganicBlob;
