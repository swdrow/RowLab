/**
 * LineupComparison - Phase 18 LINEUP-01
 *
 * Side-by-side comparison of two lineups with difference highlighting.
 * Simple seat-by-seat comparison (not complex diff algorithm).
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, User, UserMinus, UserPlus, Equal } from 'lucide-react';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  side?: string | null;
}

interface Seat {
  seatNumber: number;
  side: 'Port' | 'Starboard';
  athlete: Athlete | null;
  isCoxswain?: boolean;
}

interface Boat {
  id: string;
  name: string;
  boatClass: string;
  seats: Seat[];
  coxswain?: Athlete | null;
  hasCoxswain?: boolean;
}

interface LineupComparisonProps {
  lineup1: {
    id: string;
    name: string;
    boats: Boat[];
  };
  lineup2: {
    id: string;
    name: string;
    boats: Boat[];
  };
  className?: string;
}

type DiffType = 'same' | 'different' | 'added' | 'removed';

interface SeatComparison {
  seatNumber: number;
  isCoxswain: boolean;
  athlete1: Athlete | null;
  athlete2: Athlete | null;
  diffType: DiffType;
}

function getDiffType(athlete1: Athlete | null, athlete2: Athlete | null): DiffType {
  if (!athlete1 && !athlete2) return 'same';
  if (!athlete1 && athlete2) return 'added';
  if (athlete1 && !athlete2) return 'removed';
  if (athlete1!.id === athlete2!.id) return 'same';
  return 'different';
}

function getDiffColor(diffType: DiffType): string {
  switch (diffType) {
    case 'same':
      return 'border-bdr-default bg-bg-default';
    case 'different':
      return 'border-amber-500 bg-amber-500/10';
    case 'added':
      return 'border-green-500 bg-green-500/10';
    case 'removed':
      return 'border-red-500 bg-red-500/10';
    default:
      return 'border-bdr-default bg-bg-default';
  }
}

function DiffIcon({ diffType }: { diffType: DiffType }) {
  switch (diffType) {
    case 'same':
      return <Equal className="h-3.5 w-3.5 text-txt-tertiary" />;
    case 'different':
      return <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500" />;
    case 'added':
      return <UserPlus className="h-3.5 w-3.5 text-green-500" />;
    case 'removed':
      return <UserMinus className="h-3.5 w-3.5 text-red-500" />;
    default:
      return null;
  }
}

function AthleteCell({
  athlete,
  isEmpty,
  className = '',
}: {
  athlete: Athlete | null;
  isEmpty: boolean;
  className?: string;
}) {
  if (!athlete) {
    return (
      <div className={`flex items-center gap-2 text-txt-tertiary ${className}`}>
        <User className="h-4 w-4 opacity-50" />
        <span className="text-sm italic">{isEmpty ? '(empty)' : '—'}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${
                      athlete.side === 'Port'
                        ? 'bg-red-500/10 text-red-600'
                        : athlete.side === 'Starboard'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-bg-hover text-txt-secondary'
                    }`}
      >
        {athlete.firstName[0]}
        {athlete.lastName[0]}
      </div>
      <span className="text-sm text-txt-primary font-medium">
        {athlete.lastName}
      </span>
    </div>
  );
}

function SeatRow({ comparison }: { comparison: SeatComparison }) {
  const diffColor = getDiffColor(comparison.diffType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`grid grid-cols-[1fr,auto,1fr] gap-2 p-2 rounded-lg border ${diffColor}`}
    >
      {/* Lineup 1 athlete */}
      <AthleteCell
        athlete={comparison.athlete1}
        isEmpty={comparison.diffType === 'added'}
      />

      {/* Seat indicator and diff icon */}
      <div className="flex flex-col items-center justify-center px-2">
        <span className="text-xs font-medium text-txt-secondary">
          {comparison.isCoxswain ? 'Cox' : comparison.seatNumber}
        </span>
        <DiffIcon diffType={comparison.diffType} />
      </div>

      {/* Lineup 2 athlete */}
      <AthleteCell
        athlete={comparison.athlete2}
        isEmpty={comparison.diffType === 'removed'}
        className="flex-row-reverse"
      />
    </motion.div>
  );
}

function BoatComparison({
  boat1,
  boat2,
}: {
  boat1: Boat | undefined;
  boat2: Boat | undefined;
}) {
  const comparisons = useMemo<SeatComparison[]>(() => {
    const result: SeatComparison[] = [];

    // Get all unique seat numbers from both boats
    const seatNumbers = new Set<number>();
    boat1?.seats.forEach((s) => seatNumbers.add(s.seatNumber));
    boat2?.seats.forEach((s) => seatNumbers.add(s.seatNumber));

    // Compare each seat
    const sortedSeats = Array.from(seatNumbers).sort((a, b) => b - a); // High to low (stroke to bow)
    for (const seatNum of sortedSeats) {
      const seat1 = boat1?.seats.find((s) => s.seatNumber === seatNum);
      const seat2 = boat2?.seats.find((s) => s.seatNumber === seatNum);

      result.push({
        seatNumber: seatNum,
        isCoxswain: false,
        athlete1: seat1?.athlete || null,
        athlete2: seat2?.athlete || null,
        diffType: getDiffType(seat1?.athlete || null, seat2?.athlete || null),
      });
    }

    // Compare coxswain if either boat has one
    if (boat1?.hasCoxswain || boat2?.hasCoxswain) {
      result.push({
        seatNumber: 0,
        isCoxswain: true,
        athlete1: boat1?.coxswain || null,
        athlete2: boat2?.coxswain || null,
        diffType: getDiffType(boat1?.coxswain || null, boat2?.coxswain || null),
      });
    }

    return result;
  }, [boat1, boat2]);

  const boatClass = boat1?.name || boat2?.name || 'Unknown';
  const diffCount = comparisons.filter((c) => c.diffType !== 'same').length;

  return (
    <div className="bg-bg-elevated rounded-lg border border-bdr-default overflow-hidden">
      {/* Boat header */}
      <div className="flex items-center justify-between p-3 bg-bg-default border-b border-bdr-default">
        <h4 className="font-medium text-txt-primary">{boatClass}</h4>
        {diffCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
            {diffCount} {diffCount === 1 ? 'difference' : 'differences'}
          </span>
        )}
      </div>

      {/* Seat comparisons */}
      <div className="p-3 space-y-2">
        {comparisons.map((comparison, idx) => (
          <SeatRow key={`${comparison.seatNumber}-${idx}`} comparison={comparison} />
        ))}
      </div>
    </div>
  );
}

export function LineupComparison({
  lineup1,
  lineup2,
  className = '',
}: LineupComparisonProps) {
  // Match boats by boat class for comparison
  const boatPairs = useMemo(() => {
    const pairs: Array<{ boat1?: Boat; boat2?: Boat; boatClass: string }> = [];
    const seen = new Set<string>();

    // Add all boats from lineup1
    for (const boat of lineup1.boats) {
      const matching = lineup2.boats.find(
        (b) => b.name === boat.name && !seen.has(b.id)
      );
      pairs.push({
        boat1: boat,
        boat2: matching,
        boatClass: boat.name,
      });
      if (matching) seen.add(matching.id);
    }

    // Add boats only in lineup2
    for (const boat of lineup2.boats) {
      if (!seen.has(boat.id)) {
        pairs.push({
          boat1: undefined,
          boat2: boat,
          boatClass: boat.name,
        });
      }
    }

    return pairs;
  }, [lineup1.boats, lineup2.boats]);

  const totalDiffs = useMemo(() => {
    // Count total differences across all boats
    let count = 0;
    for (const pair of boatPairs) {
      const seats1 = pair.boat1?.seats || [];
      const seats2 = pair.boat2?.seats || [];
      const allSeats = new Set([
        ...seats1.map((s) => s.seatNumber),
        ...seats2.map((s) => s.seatNumber),
      ]);

      for (const seatNum of allSeats) {
        const s1 = seats1.find((s) => s.seatNumber === seatNum);
        const s2 = seats2.find((s) => s.seatNumber === seatNum);
        if (getDiffType(s1?.athlete || null, s2?.athlete || null) !== 'same') {
          count++;
        }
      }

      // Check coxswain
      if (pair.boat1?.hasCoxswain || pair.boat2?.hasCoxswain) {
        if (
          getDiffType(
            pair.boat1?.coxswain || null,
            pair.boat2?.coxswain || null
          ) !== 'same'
        ) {
          count++;
        }
      }
    }
    return count;
  }, [boatPairs]);

  return (
    <div className={className}>
      {/* Header with lineup names */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-semibold text-txt-primary">{lineup1.name}</h3>
        </div>
        <div className="flex items-center justify-center">
          <div className="px-3 py-1 rounded-full bg-bg-elevated border border-bdr-default">
            <span className="text-sm text-txt-secondary">
              {totalDiffs === 0
                ? 'Identical'
                : `${totalDiffs} ${totalDiffs === 1 ? 'difference' : 'differences'}`}
            </span>
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-txt-primary">{lineup2.name}</h3>
        </div>
      </div>

      {/* Boat comparisons */}
      <div className="space-y-4">
        {boatPairs.map((pair, idx) => (
          <BoatComparison
            key={`${pair.boatClass}-${idx}`}
            boat1={pair.boat1}
            boat2={pair.boat2}
          />
        ))}
      </div>
    </div>
  );
}

export default LineupComparison;
