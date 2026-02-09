/**
 * RuledHeader - Label with extending gradient line
 *
 * Replaces generic card-with-title pattern. The line fades from visible
 * to transparent, creating a directional reading flow.
 *
 * Features:
 * - Uses canvas-ruled CSS class for line animation
 * - Uppercase tracking for label
 * - Semantic section divider
 *
 * Design: Canvas ruled section header
 */

import React from 'react';

export interface RuledHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function RuledHeader({ children, className }: RuledHeaderProps) {
  return (
    <div className={`canvas-ruled mb-3 lg:mb-4 mt-2 ${className || ''}`}>
      <span className="text-[9px] lg:text-[10px] font-semibold text-ink-muted uppercase tracking-[0.15em] lg:tracking-[0.2em] select-none">
        {children}
      </span>
    </div>
  );
}
