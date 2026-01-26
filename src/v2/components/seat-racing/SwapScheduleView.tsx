import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Table, List } from '@phosphor-icons/react';
import type { SwapSchedule, SwapPiece, SwapBoatAssignment, Side } from '../../types/advancedRanking';

interface SwapScheduleViewProps {
  schedule: SwapSchedule;
  onEdit?: (pieceIndex: number) => void;
}

export function SwapScheduleView({ schedule, onEdit }: SwapScheduleViewProps) {
  return (
    <div className="space-y-4">
      {/* Statistics summary */}
      <div className="flex items-center gap-6 p-3 bg-surface-secondary rounded-lg text-sm">
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
          <span className={`font-medium ${
            schedule.statistics.coverage >= 0.9 ? 'text-green-600' :
            schedule.statistics.coverage >= 0.7 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {(schedule.statistics.coverage * 100).toFixed(0)}%
          </span>
        </span>
        <span>
          Balance:{' '}
          <span className={`font-medium ${
            schedule.statistics.balance >= 0.8 ? 'text-green-600' :
            schedule.statistics.balance >= 0.5 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {(schedule.statistics.balance * 100).toFixed(0)}%
          </span>
        </span>
      </div>

      {/* Warnings */}
      {schedule.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ul className="text-sm text-amber-800 space-y-1">
            {schedule.warnings.map((warning, idx) => (
              <li key={idx}>⚠️ {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* View tabs */}
      <Tab.Group>
        <Tab.List className="flex gap-2 border-b border-bdr-primary">
          <Tab className={({ selected }) => `
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${selected
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-txt-secondary hover:text-txt-primary'
            }
          `}>
            <Table size={16} />
            Grid View
          </Tab>
          <Tab className={({ selected }) => `
            flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
            ${selected
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-txt-secondary hover:text-txt-primary'
            }
          `}>
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
  const athleteMap = new Map(athletes.map(a => [a.id, `${a.firstName} ${a.lastName?.[0] || ''}.`]));

  // Get boat names
  const boatNames = Array.from({ length: boatCount }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-txt-secondary bg-surface-secondary border-b border-bdr-primary sticky left-0 z-10">
              Athlete
            </th>
            {pieces.map((piece) => (
              <th
                key={piece.pieceNumber}
                className="p-2 text-center text-sm font-medium text-txt-secondary bg-surface-secondary border-b border-bdr-primary"
                style={{ minWidth: '80px' }}
              >
                <div className="flex items-center justify-center gap-2">
                  Piece {piece.pieceNumber}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(piece.pieceNumber - 1)}
                      className="text-xs text-accent-primary hover:underline"
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
            <tr key={athlete.id} className="hover:bg-surface-hover">
              <td className="p-2 text-sm font-medium text-txt-primary bg-surface-secondary sticky left-0 z-10 border-b border-bdr-secondary whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {athlete.side && (
                    <span className={`w-2 h-2 rounded-full ${
                      athlete.side === 'Port' ? 'bg-red-500' :
                      athlete.side === 'Starboard' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                  )}
                  {athleteMap.get(athlete.id)}
                </div>
              </td>
              {pieces.map((piece) => {
                const boatAssignment = findAthleteBoat(piece.boats, athlete.id);
                return (
                  <td
                    key={piece.pieceNumber}
                    className={`p-2 text-center text-sm border-b border-bdr-secondary ${
                      boatAssignment
                        ? getBoatColor(boatAssignment.boatName)
                        : 'bg-gray-100 text-gray-400'
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
  const athleteMap = new Map(athletes.map(a => [a.id, `${a.firstName} ${a.lastName}`]));

  return (
    <div className="space-y-4">
      {pieces.map((piece, idx) => (
        <div key={piece.pieceNumber} className="border border-bdr-primary rounded-lg overflow-hidden">
          {/* Piece header */}
          <div className="px-4 py-2 bg-surface-secondary border-b border-bdr-primary flex items-center justify-between">
            <span className="font-medium text-txt-primary">Piece {piece.pieceNumber}</span>
            <span className="text-sm text-txt-secondary">{piece.swapDescription}</span>
          </div>

          {/* Boats */}
          <div className="p-4 grid gap-4" style={{
            gridTemplateColumns: `repeat(${piece.boats.length}, 1fr)`
          }}>
            {piece.boats.map((boat) => (
              <div key={boat.boatName} className="space-y-2">
                <div className={`text-center font-medium py-1 rounded ${getBoatColor(boat.boatName)}`}>
                  Boat {boat.boatName}
                </div>
                <ul className="space-y-1">
                  {boat.athleteIds.map((athleteId, seatIdx) => {
                    const seatAssignment = boat.seatAssignments?.[seatIdx];
                    return (
                      <li
                        key={athleteId}
                        className="text-sm px-2 py-1 bg-surface-secondary rounded flex items-center gap-2"
                      >
                        <span className="text-txt-secondary text-xs w-4">
                          {seatAssignment?.seatNumber || seatIdx + 1}
                        </span>
                        <span className="text-txt-primary">{athleteMap.get(athleteId)}</span>
                        {seatAssignment?.side && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            seatAssignment.side === 'Port' ? 'bg-red-100 text-red-700' :
                            seatAssignment.side === 'Starboard' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
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

function findAthleteBoat(boats: SwapBoatAssignment[], athleteId: string): SwapBoatAssignment | null {
  return boats.find(b => b.athleteIds.includes(athleteId)) || null;
}

function getBoatColor(boatName: string): string {
  const colors: Record<string, string> = {
    'A': 'bg-blue-100 text-blue-700',
    'B': 'bg-emerald-100 text-emerald-700',
    'C': 'bg-amber-100 text-amber-700',
    'D': 'bg-purple-100 text-purple-700',
    'E': 'bg-pink-100 text-pink-700',
    'F': 'bg-cyan-100 text-cyan-700',
  };
  return colors[boatName] || 'bg-gray-100 text-gray-700';
}

export default SwapScheduleView;
