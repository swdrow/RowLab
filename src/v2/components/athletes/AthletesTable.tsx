import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { VirtualTable } from '@v2/components/common/VirtualTable';
import { AthleteAvatar } from './AthleteAvatar';
import type { Athlete } from '@v2/types/athletes';

export interface AthletesTableProps {
  athletes: Athlete[];
  onAthleteClick?: (athlete: Athlete) => void;
  selectedId?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Format biometric value with unit
 */
function formatBiometric(value: number | null, unit: string): string {
  if (value === null) return '—';
  return `${value}${unit}`;
}

/**
 * Format side preference badge
 */
function SideBadge({ side }: { side: Athlete['side'] }) {
  if (!side) return <span className="text-txt-tertiary">—</span>;

  const colors = {
    Port: 'bg-red-500/10 text-red-600 dark:text-red-400',
    Starboard: 'bg-green-500/10 text-green-600 dark:text-green-400',
    Both: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    Cox: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[side]}`}>
      {side}
    </span>
  );
}

/**
 * Format capability badges
 */
function CapabilityBadges({ canScull, canCox }: { canScull: boolean; canCox: boolean }) {
  if (!canScull && !canCox) return <span className="text-txt-tertiary">—</span>;

  return (
    <div className="flex gap-1">
      {canScull && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-active text-txt-primary">
          Scull
        </span>
      )}
      {canCox && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-active text-txt-primary">
          Cox
        </span>
      )}
    </div>
  );
}

export function AthletesTable({
  athletes,
  onAthleteClick,
  selectedId,
  isLoading = false,
  className = '',
}: AthletesTableProps) {
  const columns = useMemo<ColumnDef<Athlete, any>[]>(
    () => [
      {
        id: 'name',
        header: 'Athlete',
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AthleteAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              size="sm"
            />
            <div>
              <div className="font-medium text-txt-primary">
                {row.original.firstName} {row.original.lastName}
              </div>
              {row.original.email && (
                <div className="text-xs text-txt-tertiary">{row.original.email}</div>
              )}
            </div>
          </div>
        ),
        size: 250,
      },
      {
        id: 'side',
        header: 'Side',
        accessorKey: 'side',
        cell: ({ row }) => <SideBadge side={row.original.side} />,
        size: 120,
      },
      {
        id: 'capabilities',
        header: 'Capabilities',
        accessorFn: (row) => `${row.canScull ? 'Scull' : ''} ${row.canCox ? 'Cox' : ''}`,
        cell: ({ row }) => (
          <CapabilityBadges canScull={row.original.canScull} canCox={row.original.canCox} />
        ),
        size: 140,
      },
      {
        id: 'weight',
        header: 'Weight',
        accessorKey: 'weightKg',
        cell: ({ row }) => (
          <span className="text-txt-secondary">
            {formatBiometric(row.original.weightKg, 'kg')}
          </span>
        ),
        size: 100,
      },
      {
        id: 'height',
        header: 'Height',
        accessorKey: 'heightCm',
        cell: ({ row }) => (
          <span className="text-txt-secondary">
            {formatBiometric(row.original.heightCm, 'cm')}
          </span>
        ),
        size: 100,
      },
    ],
    []
  );

  return (
    <VirtualTable
      data={athletes}
      columns={columns}
      onRowClick={onAthleteClick}
      selectedId={selectedId}
      getRowId={(row) => row.id}
      rowHeight={60}
      overscan={20}
      emptyMessage="No athletes found"
      isLoading={isLoading}
      className={className}
    />
  );
}

export default AthletesTable;
