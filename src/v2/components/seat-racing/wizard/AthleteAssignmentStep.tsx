import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAthletes } from '@v2/hooks/useAthletes';
import { SeatSlotSelector } from './SeatSlotSelector';
import type { Athlete } from '@v2/types/athletes';

/**
 * Form data structure for session wizard
 */
interface SessionFormData {
  date: string;
  boatClass: string;
  conditions: string | null;
  location: string | null;
  description: string | null;
  pieces: PieceFormData[];
}

interface PieceFormData {
  sequenceOrder: number;
  distanceMeters: number | null;
  direction: 'upstream' | 'downstream' | null;
  notes: string | null;
  boats: BoatFormData[];
}

interface BoatFormData {
  name: string;
  finishTimeSeconds: number | null;
  handicapSeconds: number;
  assignments?: AssignmentFormData[];
}

interface AssignmentFormData {
  athleteId: string;
  seatNumber: number;
  side: 'Port' | 'Starboard' | 'Cox';
}

interface SeatSlot {
  seatNumber: number;
  side: 'Port' | 'Starboard' | 'Cox';
  label: string;
}

interface BoatSeatConfig {
  seats: number;
  hasCox: boolean;
}

/**
 * AthleteAssignmentStep - Step 3 of session wizard
 *
 * Allows coaches to assign athletes to seats in each boat across all pieces.
 *
 * Features:
 * - Displays all pieces with their boats
 * - Each boat shows seat slots based on boat class
 * - Athletes can be assigned to seats via dropdown
 * - Tracks assigned athletes globally to prevent double-assignment
 * - Auto-detects switches between pieces
 */
export function AthleteAssignmentStep() {
  const { watch, setValue } = useFormContext<SessionFormData>();
  const { athletes = [], isLoading } = useAthletes();

  const pieces = watch('pieces') || [];
  const boatClass = watch('boatClass');

  // Determine seats needed based on boat class
  const seatConfig = useMemo(() => getBoatSeatConfig(boatClass), [boatClass]);

  // Track all assigned athletes across all boats
  const assignedAthleteIds = useMemo(() => {
    const ids = new Set<string>();
    pieces.forEach((piece) => {
      piece.boats.forEach((boat) => {
        boat.assignments?.forEach((a) => ids.add(a.athleteId));
      });
    });
    return ids;
  }, [pieces]);

  // Detect switches between pieces
  const switches = useMemo(() => detectSwitches(pieces, athletes), [pieces, athletes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-txt-secondary">Loading athletes...</div>
      </div>
    );
  }

  if (pieces.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-txt-secondary">
          No pieces added yet. Please add pieces in Step 2.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pieces */}
      {pieces.map((piece, pieceIndex) => (
        <div key={pieceIndex} className="border border-bdr-default rounded-lg p-6 bg-bg-surface">
          <h3 className="text-lg font-semibold text-txt-primary mb-4">
            Piece #{piece.sequenceOrder}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {piece.boats.map((boat, boatIndex) => (
              <BoatAssignmentCard
                key={boatIndex}
                pieceIndex={pieceIndex}
                boatIndex={boatIndex}
                boat={boat}
                seatConfig={seatConfig}
                athletes={athletes}
                assignedAthleteIds={assignedAthleteIds}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Switch Summary */}
      {switches.length > 0 && <SwitchSummary switches={switches} />}

      {/* Instructions */}
      <div className="text-sm text-txt-tertiary bg-bg-elevated rounded-lg p-4">
        <p className="font-medium text-txt-secondary mb-1">Assignment Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Athletes can only be assigned to one seat at a time</li>
          <li>Seat side preferences are highlighted for guidance</li>
          <li>Partial lineups are allowed - you can leave seats empty</li>
          <li>Switches between pieces are automatically detected</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * BoatAssignmentCard - Shows seat slots for a single boat
 */
interface BoatAssignmentCardProps {
  pieceIndex: number;
  boatIndex: number;
  boat: BoatFormData;
  seatConfig: BoatSeatConfig;
  athletes: Athlete[];
  assignedAthleteIds: Set<string>;
}

function BoatAssignmentCard({
  pieceIndex,
  boatIndex,
  boat,
  seatConfig,
  athletes,
  assignedAthleteIds,
}: BoatAssignmentCardProps) {
  const { setValue, watch } = useFormContext<SessionFormData>();
  const fieldPrefix = `pieces.${pieceIndex}.boats.${boatIndex}`;
  const assignments = watch(`${fieldPrefix}.assignments`) || [];

  // Generate seat slots based on boat class
  const seatSlots = useMemo(() => generateSeatSlots(seatConfig), [seatConfig]);

  const handleAssign = (seatNumber: number, side: 'Port' | 'Starboard' | 'Cox', athleteId: string | null) => {
    const newAssignments = [...assignments];
    const existingIndex = newAssignments.findIndex((a) => a.seatNumber === seatNumber);

    if (athleteId === null) {
      // Remove assignment
      if (existingIndex >= 0) {
        newAssignments.splice(existingIndex, 1);
      }
    } else {
      const assignment = { athleteId, seatNumber, side };
      if (existingIndex >= 0) {
        newAssignments[existingIndex] = assignment;
      } else {
        newAssignments.push(assignment);
      }
    }

    setValue(`${fieldPrefix}.assignments`, newAssignments);
  };

  // Calculate assignment count
  const assignmentCount = assignments.length;
  const totalSeats = seatSlots.length;

  return (
    <div className="bg-bg-elevated rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-txt-primary">{boat.name}</h4>
        <span className="text-xs text-txt-tertiary">
          {assignmentCount}/{totalSeats} seats filled
        </span>
      </div>

      <div className="space-y-2">
        {seatSlots.map((slot) => {
          const assignment = assignments.find((a) => a.seatNumber === slot.seatNumber);
          // Don't disable the current assignment's athlete
          const disabledIds = Array.from(assignedAthleteIds).filter(
            (id) => id !== assignment?.athleteId
          );

          return (
            <div key={slot.seatNumber} className="flex items-center gap-3">
              <span className="w-20 text-sm text-txt-secondary font-medium">
                {slot.label}
              </span>
              <SeatSlotSelector
                value={assignment?.athleteId || null}
                onChange={(id) => handleAssign(slot.seatNumber, slot.side, id)}
                athletes={athletes}
                seatNumber={slot.seatNumber}
                side={slot.side}
                disabledAthleteIds={disabledIds}
                placeholder="Select athlete"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * SwitchSummary - Shows detected switches between pieces
 */
interface Switch {
  fromPiece: number;
  toPiece: number;
  athletes: Array<{
    name: string;
    fromBoat: string;
    toBoat: string;
  }>;
}

interface SwitchSummaryProps {
  switches: Switch[];
}

function SwitchSummary({ switches }: SwitchSummaryProps) {
  if (switches.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <h4 className="font-medium text-txt-primary mb-2">Detected Switches</h4>
      <div className="space-y-2">
        {switches.map((sw, i) => (
          <div key={i} className="text-sm text-txt-secondary">
            <span className="font-medium">
              Piece {sw.fromPiece} → Piece {sw.toPiece}:
            </span>{' '}
            {sw.athletes.map((a, j) => (
              <span key={j}>
                {j > 0 && ', '}
                <span className="text-txt-primary">{a.name}</span> ({a.fromBoat} → {a.toBoat})
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper: Get boat seat configuration based on boat class
 */
function getBoatSeatConfig(boatClass: string): BoatSeatConfig {
  const configs: Record<string, BoatSeatConfig> = {
    '8+': { seats: 8, hasCox: true },
    '4+': { seats: 4, hasCox: true },
    '4-': { seats: 4, hasCox: false },
    '4x': { seats: 4, hasCox: false },
    '2-': { seats: 2, hasCox: false },
    '2x': { seats: 2, hasCox: false },
    '1x': { seats: 1, hasCox: false },
  };
  return configs[boatClass] || { seats: 4, hasCox: true };
}

/**
 * Helper: Generate seat slots based on boat configuration
 */
function generateSeatSlots(config: BoatSeatConfig): SeatSlot[] {
  const slots: SeatSlot[] = [];

  // Sweep boats alternate port/starboard starting at bow
  for (let i = 1; i <= config.seats; i++) {
    slots.push({
      seatNumber: i,
      side: i % 2 === 0 ? 'Port' : 'Starboard',
      label: i === 1 ? 'Bow' : i === config.seats ? 'Stroke' : `Seat ${i}`,
    });
  }

  // Add coxswain if present
  if (config.hasCox) {
    slots.push({
      seatNumber: config.seats + 1,
      side: 'Cox',
      label: 'Cox',
    });
  }

  return slots;
}

/**
 * Helper: Detect athlete switches between consecutive pieces
 */
function detectSwitches(pieces: PieceFormData[], athletes: Athlete[]): Switch[] {
  const switches: Switch[] = [];

  // Compare each piece to the previous one
  for (let i = 1; i < pieces.length; i++) {
    const prevPiece = pieces[i - 1];
    const currPiece = pieces[i];

    const athleteMovements: Switch['athletes'] = [];

    // Build map of athlete -> boat for previous piece
    const prevAthleteBoats = new Map<string, string>();
    prevPiece.boats.forEach((boat) => {
      boat.assignments?.forEach((assignment) => {
        prevAthleteBoats.set(assignment.athleteId, boat.name);
      });
    });

    // Check current piece for athletes who changed boats
    currPiece.boats.forEach((boat) => {
      boat.assignments?.forEach((assignment) => {
        const prevBoat = prevAthleteBoats.get(assignment.athleteId);
        if (prevBoat && prevBoat !== boat.name) {
          const athlete = athletes.find((a) => a.id === assignment.athleteId);
          if (athlete) {
            athleteMovements.push({
              name: `${athlete.firstName} ${athlete.lastName}`,
              fromBoat: prevBoat,
              toBoat: boat.name,
            });
          }
        }
      });
    });

    if (athleteMovements.length > 0) {
      switches.push({
        fromPiece: prevPiece.sequenceOrder,
        toPiece: currPiece.sequenceOrder,
        athletes: athleteMovements,
      });
    }
  }

  return switches;
}
