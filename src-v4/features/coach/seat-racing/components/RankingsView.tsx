/**
 * Rankings view combining ELO distribution chart and ranked table.
 *
 * Includes side filter (All / Port / Starboard) and Recalculate button.
 * This is the default view for the seat racing page.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ratingsOptions, useRecalculate } from '../api';
import type { Side } from '../types';
import { EloChart } from './EloChart';
import { RankingsTable } from './RankingsTable';
import { IconRefresh } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SideFilter = 'All' | Side;

interface RankingsViewProps {
  teamId: string;
}

// ---------------------------------------------------------------------------
// Side filter
// ---------------------------------------------------------------------------

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Port', label: 'Port' },
  { value: 'Starboard', label: 'Starboard' },
];

function SideFilterBar({
  value,
  onChange,
}: {
  value: SideFilter;
  onChange: (v: SideFilter) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg bg-void-deep p-0.5"
      role="radiogroup"
      aria-label="Side filter"
    >
      {SIDE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-void-raised text-text-bright shadow-sm'
                : 'text-text-faint hover:text-text-dim'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RankingsView
// ---------------------------------------------------------------------------

export function RankingsView({ teamId }: RankingsViewProps) {
  const [sideFilter, setSideFilter] = useState<SideFilter>('All');

  // Fetch ratings with optional side filter
  const sideParam = sideFilter === 'All' ? undefined : (sideFilter as Side);
  const { data: ratings = [], isLoading } = useQuery(ratingsOptions(teamId, sideParam));

  // Recalculate mutation
  const { mutate: recalculate, isPending: isRecalculating } = useRecalculate(teamId);

  return (
    <div className="space-y-6">
      {/* Header row: title + side filter + recalculate */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-display font-semibold text-text-bright">Rankings</h2>
        <div className="flex items-center gap-3">
          <SideFilterBar value={sideFilter} onChange={setSideFilter} />
          <Button
            variant="secondary"
            size="sm"
            loading={isRecalculating}
            onClick={() => recalculate()}
          >
            <IconRefresh width={14} height={14} />
            Recalculate
          </Button>
        </div>
      </div>

      {/* ELO Distribution chart */}
      <Card padding="md">
        <h3 className="text-sm font-display font-medium text-text-dim uppercase tracking-wider mb-4">
          ELO Distribution
        </h3>
        {isLoading ? (
          <div className="h-[280px] bg-void-raised animate-shimmer rounded-lg" aria-hidden="true" />
        ) : (
          <EloChart ratings={ratings} />
        )}
      </Card>

      {/* Rankings table */}
      <Card padding="none">
        <RankingsTable ratings={ratings} isLoading={isLoading} />
      </Card>
    </div>
  );
}
