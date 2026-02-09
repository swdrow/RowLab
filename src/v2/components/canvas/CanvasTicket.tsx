/**
 * CanvasTicket - Chamfered ticket with tilt-on-hover
 *
 * Session cards that feel like physical tickets tilting when you pick them up.
 * Combined with canvas-chamfer for the cut corner.
 *
 * Features:
 * - Chamfer corner (top-right diagonal)
 * - Top accent line that stops at chamfer
 * - Tilt animation on hover via CSS
 * - Lift and rotate interaction
 *
 * Design: Canvas physical ticket metaphor
 */

import React from 'react';

export interface CanvasTicketProps {
  children: React.ReactNode;
  className?: string;
}

export function CanvasTicket({ children, className = '' }: CanvasTicketProps) {
  return (
    <div
      className={`canvas-chamfer-sm lg:canvas-chamfer canvas-ticket canvas-ticket-tilt bg-ink-raised relative p-3 lg:p-4 group ${className}`}
    >
      {/* Top accent line — stops at chamfer cut */}
      <div
        className="absolute top-0 left-0 h-px"
        style={{
          right: '6px',
          background: 'linear-gradient(to right, rgba(255,255,255,0.06), transparent)',
        }}
      />

      {children}
    </div>
  );
}
