/**
 * CanvasConsoleReadout - Monospace instrument display
 *
 * Used for status strips. Feels like a cox box readout with pipe separators
 * and a blinking cursor at the end.
 *
 * Features:
 * - Monospace font from Geist Mono
 * - Pipe separators between items
 * - Blinking cursor at end via canvas-cursor CSS
 * - Compact horizontal layout
 *
 * Design: Canvas console readout
 */

export interface CanvasConsoleReadoutProps {
  items: Array<{ label: string; value: string }>;
  className?: string;
}

export function CanvasConsoleReadout({ items, className = '' }: CanvasConsoleReadoutProps) {
  return (
    <div className={`canvas-console canvas-console-grid text-[11px] lg:text-xs ${className}`}>
      {items.map((pair) => (
        <div key={pair.label} className="flex items-center justify-between lg:justify-start gap-2">
          <span className="text-ink-muted">{pair.label}</span>
          <span className="text-ink-primary font-medium">{pair.value}</span>
        </div>
      ))}
      <span className="canvas-cursor text-ink-muted hidden lg:inline" />
    </div>
  );
}
