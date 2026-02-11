/**
 * Widget Size Selector
 * Phase 27-05: Size preset picker for dashboard widgets
 */

import { getWidgetConfig } from '../config/widgetRegistry';
import type { WidgetSize } from '../types';

interface WidgetSizeSelectorProps {
  widgetType: string;
  currentSize: WidgetSize;
  onSizeChange: (newSize: WidgetSize) => void;
}

const SIZE_LABELS: Record<WidgetSize, string> = {
  compact: 'S',
  normal: 'M',
  expanded: 'L',
};

/**
 * WidgetSizeSelector - Compact size preset picker
 *
 * Features:
 * - Shows only available sizes from widget config
 * - Active size highlighted with accent-primary
 * - Tooltip showing grid dimensions
 * - Compact horizontal button group
 */
export function WidgetSizeSelector({
  widgetType,
  currentSize,
  onSizeChange,
}: WidgetSizeSelectorProps) {
  const config = getWidgetConfig(widgetType);

  if (!config) {
    console.error(`Widget config not found: ${widgetType}`);
    return null;
  }

  // Get available sizes for this widget
  const availableSizes = Object.keys(config.sizes) as WidgetSize[];

  // If only one size available, don't show selector
  if (availableSizes.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Widget size">
      {availableSizes.map((size) => {
        const sizeConfig = config.sizes[size];
        if (!sizeConfig) return null;

        const isActive = currentSize === size;

        return (
          <button
            type="button"
            key={size}
            onClick={() => onSizeChange(size)}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              isActive
                ? 'bg-accent-primary text-white'
                : 'text-ink-secondary hover:bg-ink-raised hover:text-ink-bright'
            }`}
            title={`${size} (${sizeConfig.w}×${sizeConfig.h} cells)`}
            aria-pressed={isActive}
          >
            {SIZE_LABELS[size]}
          </button>
        );
      })}
    </div>
  );
}
