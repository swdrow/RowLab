/**
 * RangeSelector -- horizontal row of preset time range buttons.
 *
 * Uses the shared TabToggle component for animated pill-style selection
 * with consistent design system treatment across the app.
 */

import { useCallback } from 'react';
import { TabToggle, type Tab } from '@/components/ui/TabToggle';
import type { PMCRange } from '../types';

const RANGE_TABS: Tab[] = [
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '180d', label: '180D' },
  { id: '365d', label: '1Y' },
  { id: 'all', label: 'All' },
];

interface RangeSelectorProps {
  value: PMCRange;
  onChange: (range: PMCRange) => void;
  className?: string;
}

export function RangeSelector({ value, onChange, className }: RangeSelectorProps) {
  const handleTabChange = useCallback(
    (tabId: string) => {
      onChange(tabId as PMCRange);
    },
    [onChange]
  );

  return (
    <TabToggle
      tabs={RANGE_TABS}
      activeTab={value}
      onTabChange={handleTabChange}
      layoutId="range-selector"
      size="sm"
      className={className}
    />
  );
}
