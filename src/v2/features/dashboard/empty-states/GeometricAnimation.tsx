import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, SPRING_GENTLE } from '../../../utils/animations';
import type { GeometricAnimationConfig } from './animations';

interface GeometricAnimationProps {
  config: GeometricAnimationConfig;
  size?: number;
  className?: string;
}

/**
 * GeometricAnimation - Renders abstract geometric shapes with Framer Motion
 *
 * Features:
 * - Uses design system tokens for colors
 * - Plays once on mount with staggered delays
 * - Uses IntersectionObserver to pause when offscreen
 * - Respects reduced motion preference
 * - Subtle gradient fills for warm aesthetic
 */
export const GeometricAnimation: React.FC<GeometricAnimationProps> = ({
  config,
  size = 160,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Pause animation when offscreen for performance
  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, []);

  const transition = prefersReducedMotion ? { duration: 0 } : { ...SPRING_GENTLE, delay: 0 };

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gradient for warm aesthetic */}
        <linearGradient id="warmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {config.type === 'pulse' && (
        <g transform="translate(80, 80)">
          {config.shapes.map((shape, index) => (
            <motion.circle
              key={index}
              cx={0}
              cy={0}
              r={shape.size / 2}
              stroke={shape.color}
              strokeWidth={2}
              fill="url(#warmGradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={isVisible ? { scale: 1, opacity: 0.6 } : { scale: 0, opacity: 0 }}
              transition={{
                ...transition,
                delay: prefersReducedMotion ? 0 : shape.delay,
              }}
              style={{ color: shape.color }}
            />
          ))}
        </g>
      )}

      {config.type === 'chart' && (
        <g transform="translate(20, 130)">
          {config.shapes.map((shape, index) => (
            <motion.rect
              key={index}
              x={index * 32}
              y={-shape.size}
              width={24}
              height={shape.size}
              fill={shape.color}
              rx={4}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={isVisible ? { scaleY: 1, opacity: 0.8 } : { scaleY: 0, opacity: 0 }}
              transition={{
                ...transition,
                delay: prefersReducedMotion ? 0 : shape.delay,
              }}
              style={{ transformOrigin: 'bottom' }}
            />
          ))}
        </g>
      )}

      {config.type === 'calendar' && (
        <g transform="translate(80, 80)">
          {config.shapes.map((shape, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);
            return (
              <motion.circle
                key={index}
                cx={col * 20 - 20}
                cy={row * 20 - 20}
                r={shape.size / 2}
                fill={shape.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={isVisible ? { scale: 1, opacity: 0.7 } : { scale: 0, opacity: 0 }}
                transition={{
                  ...transition,
                  delay: prefersReducedMotion ? 0 : shape.delay,
                }}
              />
            );
          })}
        </g>
      )}

      {config.type === 'team' && (
        <g transform="translate(80, 80)">
          {config.shapes.map((shape, index) => {
            const angle = (index * Math.PI * 2) / config.shapes.length;
            const radius = 30;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r={shape.size / 2}
                fill={shape.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={isVisible ? { scale: 1, opacity: 0.7 } : { scale: 0, opacity: 0 }}
                transition={{
                  ...transition,
                  delay: prefersReducedMotion ? 0 : shape.delay,
                }}
              />
            );
          })}
        </g>
      )}

      {config.type === 'trophy' && (
        <g transform="translate(80, 80)">
          {config.shapes.map((shape, index) => {
            if (shape.type === 'circle') {
              return (
                <motion.circle
                  key={index}
                  cx={0}
                  cy={-10}
                  r={shape.size / 2}
                  fill={shape.color}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isVisible ? { scale: 1, opacity: 0.8 } : { scale: 0, opacity: 0 }}
                  transition={{
                    ...transition,
                    delay: prefersReducedMotion ? 0 : shape.delay,
                  }}
                />
              );
            } else {
              return (
                <motion.rect
                  key={index}
                  x={-shape.size / 2}
                  y={index === 1 ? 15 : 25}
                  width={shape.size}
                  height={shape.size}
                  fill={shape.color}
                  rx={2}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={isVisible ? { scaleY: 1, opacity: 0.7 } : { scaleY: 0, opacity: 0 }}
                  transition={{
                    ...transition,
                    delay: prefersReducedMotion ? 0 : shape.delay,
                  }}
                  style={{ transformOrigin: 'top' }}
                />
              );
            }
          })}
        </g>
      )}

      {config.type === 'rocket' && (
        <g transform="translate(80, 80)">
          {config.shapes.map((shape, index) => {
            if (shape.type === 'rect') {
              return (
                <motion.rect
                  key={index}
                  x={-shape.size / 3}
                  y={-shape.size / 2}
                  width={shape.size / 1.5}
                  height={shape.size}
                  fill={shape.color}
                  rx={4}
                  initial={{ y: 20, opacity: 0 }}
                  animate={isVisible ? { y: -shape.size / 2, opacity: 0.8 } : { y: 20, opacity: 0 }}
                  transition={{
                    ...transition,
                    delay: prefersReducedMotion ? 0 : shape.delay,
                  }}
                />
              );
            } else {
              return (
                <motion.circle
                  key={index}
                  cx={0}
                  cy={30 + index * 10}
                  r={shape.size / 2}
                  fill={shape.color}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isVisible ? { scale: 1, opacity: 0.5 } : { scale: 0, opacity: 0 }}
                  transition={{
                    ...transition,
                    delay: prefersReducedMotion ? 0 : shape.delay,
                  }}
                />
              );
            }
          })}
        </g>
      )}
    </svg>
  );
};
