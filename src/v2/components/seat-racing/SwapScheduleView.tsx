import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Table, List } from '@phosphor-icons/react';
import type {
  SwapSchedule,
  SwapPiece,
  SwapBoatAssignment,
  Side,
} from '../../types/advancedRanking';

interface SwapScheduleViewProps {
  schedule: SwapSchedule;
  onEdit?: (pieceIndex: number) => void;
}

export function SwapScheduleView({ schedule, onEdit }: SwapScheduleViewProps) {
  return (
    <div className="space-y-4">
      {/* Statistics summary */}
      <div className="flex items-center gap-6 p-3 bg-bg-raised rounded-lg text-sm">
        <span>
          <span className="font-medium text-txt-primary">{schedule.pieceCount}</span>
          <span className="text-txt-secondary ml-1">pieces</span>
        </span>
        <span>
          <span className="font-medium text-txt-primary">{schedule.boatCount}</span>
          <span className="text-txt-secondary ml-1">boats</span>
        </span>
        <span>
          Coverage:{' '}
          <span
            className={`font-medium ${
              schedule.statistics.coverage >= 0.9
                ? 'text-data-excellent'
                : schedule.statistics.coverage >= 0.7
                  ? 'text-data-warning'
                  : 'text-data-poor'
            }`}
          >
            {(schedule.statistics.coverage * 100).toFixed(0)}%
          </span>
        </span>
        <span>
          Balance:{' '}
          <span
            className={`font-medium ${
              schedule.statistics.balance >= 0.8
                ? 'text-data-excellent'
                : schedule.statistics.balance >= 0.5
                  ? 'text-data-warning'
                  : 'text-data-poor'
            }`}
          >
            {(schedule.statistics.balance * 100).toFixed(0)}%
          </span>
        </span>
      </div>

      {/* Warnings */}
      {schedule.warnings.length > 0 && (
        <div className="p-3 bg-data-warning/10 border border-data-warning rounded-lg">
          <ul className="text-sm text-data-warning space-y-1">
            {schedule.warnings.map((warning, idx) => (
              <li key={idx}>⚠️ {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* View tabs */}
      <Tab.Group>
        <Tab.List className="flex gap-2 border-b border-bdr-default">
          <Tab
            className={({ selected }) => `
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${
              selected
                ? 'text-interactive-primary border-b-2 border-interactive-primary'
                : 'text-txt-secondary hover:text-txt-primary'
            }
          `}
          >
            <Table size={16} />
            Grid View
          </Tab>
          <Tab
            className={({ selected }) => `
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${
              selected
                ? 'text-interactive-primary border-b-2 border-interactive-primary'
                : 'text-txt-secondary hover:text-txt-primary'
            }
          `}
          >
            <List size={16} />
            Timeline View
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <SwapScheduleGrid schedule={schedule} onEdit={onEdit} />
          </Tab.Panel>
          <Tab.Panel>
            <SwapScheduleTimeline schedule={schedule} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

// ============================================
// GRID VIEW
// ============================================

interface SwapScheduleGridProps {
  schedule: SwapSchedule;
  onEdit?: (pieceIndex: number) => void;
}

export function SwapScheduleGrid({ schedule, onEdit }: SwapScheduleGridProps) {
  const { pieces, athletes, boatCount } = schedule;

  // Build athlete ID to name map
  const athleteMap = new Map(
    athletes.map((a) => [a.id, `${a.firstName} ${a.lastName?.[0] || ''}.`])
  );

  // Get boat names
  const boatNames = Array.from({ length: boatCount }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-txt-secondary bg-bg-raised border-b border-bdr-default sticky left-0 z-10">
              Athlete
            </th>
            {pieces.map((piece) => (
              <th
                key={piece.pieceNumber}
                className="p-2 text-center text-sm font-medium text-txt-secondary bg-bg-raised border-b border-bdr-default"
                style={{ minWidth: '80px' }}
              >
                <div className="flex items-center justify-center gap-2">
                  Piece {piece.pieceNumber}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(piece.pieceNumber - 1)}
                      className="text-xs text-interactive-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <tr key={athlete.id} className="hover:bg-bg-hover">
              <td className="p-2 text-sm font-medium text-txt-primary bg-bg-raised sticky left-0 z-10 border-b border-bdr-subtle whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {athlete.side && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        athlete.side === 'Port'
                          ? 'bg-data-poor'
                          : athlete.side === 'Starboard'
                            ? 'bg-data-excellent'
                            : 'bg-data-good'
                      }`}
                    />
                  )}
                  {athleteMap.get(athlete.id)}
                </div>
              </td>
              {pieces.map((piece) => {
                const boatAssignment = findAthleteBoat(piece.boats, athlete.id);
                return (
                  <td
                    key={piece.pieceNumber}
                    className={`p-2 text-center text-sm border-b border-bdr-subtle transition-colors duration-300 ${
                      boatAssignment
                        ? getBoatColor(boatAssignment.boatName)
                        : 'bg-bg-base text-txt-tertiary'
                    }`}
                  >
                    {boatAssignment ? boatAssignment.boatName : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// TIMELINE VIEW
// ============================================

interface SwapScheduleTimelineProps {
  schedule: SwapSchedule;
}

export function SwapScheduleTimeline({ schedule }: SwapScheduleTimelineProps) {
  const { pieces, athletes } = schedule;
  const athleteMap = new Map(athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));

  return (
    <div className="space-y-4">
      {pieces.map((piece, idx) => (
        <div
          key={piece.pieceNumber}
          className="border border-bdr-default rounded-lg overflow-hidden"
        >
          {/* Piece header */}
          <div className="px-4 py-2 bg-bg-raised border-b border-bdr-default flex items-center justify-between">
            <span className="font-medium text-txt-primary">Piece {piece.pieceNumber}</span>
            <span className="text-sm text-txt-secondary">{piece.swapDescription}</span>
          </div>

          {/* Boats */}
          <div
            className="p-4 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${piece.boats.length}, 1fr)`,
            }}
          >
            {piece.boats.map((boat) => (
              <div key={boat.boatName} className="space-y-2">
                <div
                  className={`text-center font-medium py-1 rounded transition-colors duration-300 ${getBoatColor(boat.boatName)}`}
                >
                  Boat {boat.boatName}
                </div>
                <ul className="space-y-1">
                  {boat.athleteIds.map((athleteId, seatIdx) => {
                    const seatAssignment = boat.seatAssignments?.[seatIdx];
                    return (
                      <li
                        key={athleteId}
                        className="text-sm px-2 py-1 bg-bg-raised rounded flex items-center gap-2 transition-colors duration-200"
                      >
                        <span className="text-txt-secondary text-xs w-4">
                          {seatAssignment?.seatNumber || seatIdx + 1}
                        </span>
                        <span className="text-txt-primary">{athleteMap.get(athleteId)}</span>
                        {seatAssignment?.side && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              seatAssignment.side === 'Port'
                                ? 'bg-data-poor/20 text-data-poor'
                                : seatAssignment.side === 'Starboard'
                                  ? 'bg-data-excellent/20 text-data-excellent'
                                  : 'bg-data-good/20 text-data-good'
                            }`}
                          >
                            {seatAssignment.side[0]}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function findAthleteBoat(
  boats: SwapBoatAssignment[],
  athleteId: string
): SwapBoatAssignment | null {
  return boats.find((b) => b.athleteIds.includes(athleteId)) || null;
}

function getBoatColor(boatName: string): string {
  const colors: Record<string, string> = {
    A: 'bg-data-good/20 text-data-good',
    B: 'bg-data-excellent/20 text-data-excellent',
    C: 'bg-data-warning/20 text-data-warning',
    D: 'bg-accent-copper/20 text-accent-copper',
    E: 'bg-chart-1/20 text-chart-1',
    F: 'bg-chart-2/20 text-chart-2',
  };
  return colors[boatName] || 'bg-txt-tertiary/20 text-txt-tertiary';
}

export default SwapScheduleView;
