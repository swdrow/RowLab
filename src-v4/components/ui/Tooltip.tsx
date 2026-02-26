/**
 * Tooltip component — oarbit design system.
 *
 * bg-void-overlay, border-edge-default, shadow-sm.
 * Compact padding: space-2 (8px) horizontal, space-1 (4px) vertical.
 * radius-sm (4px). Max-width 240px.
 * Show delay: 300ms. Hide delay: 0ms.
 * Animation: duration-micro (100ms) fade in.
 */

import { useState, useRef, useCallback, type ReactNode, type ReactElement } from 'react';

interface TooltipProps {
  /** The content to display in the tooltip */
  content: ReactNode;
  /** The trigger element. Must accept onMouseEnter/onMouseLeave/onFocus/onBlur. */
  children: ReactElement;
  /** Preferred placement */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms). Default 300. */
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    showTimer.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(showTimer.current);
    setVisible(false);
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`
            absolute z-50 ${positionClasses[side]}
            bg-void-overlay border border-edge-default shadow-sm
            rounded-[var(--radius-sm)]
            px-2 py-1 max-w-[240px]
            text-sm text-text-bright whitespace-normal
            pointer-events-none
            animate-in fade-in duration-100
            ${className}
          `.trim()}
        >
          {content}
        </div>
      )}
    </div>
  );
}
