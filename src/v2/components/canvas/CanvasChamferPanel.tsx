/**
 * CanvasChamferPanel - Chamfered panel with breathing accent edge
 *
 * The signature Canvas shape: diagonal cut corner (NOT rounded).
 * Optional left accent edge that breathes slowly like a heartbeat monitor.
 *
 * Features:
 * - Clip-path chamfer corner (top-right)
 * - Optional breathing left accent edge
 * - Inner radial glow from accent color
 * - Hover lift animation
 * - Featured variant (double-width support via className)
 *
 * Design: Canvas instrument panel
 */

import { motion } from 'framer-motion';
import React from 'react';

export interface CanvasChamferPanelProps {
  children: React.ReactNode;
  accentColor?: string;
  featured?: boolean;
  className?: string;
  breatheDelay?: number;
}

export function CanvasChamferPanel({
  children,
  accentColor,
  featured = false,
  className = '',
  breatheDelay = 0,
}: CanvasChamferPanelProps) {
  return (
    <motion.div
      className={`canvas-chamfer-sm lg:canvas-chamfer bg-ink-raised relative p-3 lg:p-5 group ${featured ? 'col-span-2' : ''} ${className}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {accentColor && (
        <>
          {/* Inner breathing radiance — subtle glow from the accent edge */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 50% 80% at 0% 50%, ${accentColor} 0%, transparent 60%)`,
            }}
            animate={{ opacity: [0, 0.04, 0] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: breatheDelay,
            }}
          />

          {/* Left accent edge — breathes slowly, staggered per panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5 canvas-accent-breathe"
            style={{
              backgroundColor: accentColor,
              animationDelay: `${breatheDelay}s`,
            }}
          />
        </>
      )}

      {children}
    </motion.div>
  );
}
