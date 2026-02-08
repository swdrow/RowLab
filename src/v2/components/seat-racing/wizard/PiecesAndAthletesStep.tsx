/**
 * PiecesAndAthletesStep - Combined wizard step for pieces and athlete assignments
 *
 * Merges functionality of:
 * - PieceManagerStep: Create/manage pieces with boats and times
 * - AthleteAssignmentStep: Assign athletes to seats
 *
 * Features:
 * - Collapsible piece cards with boats nested inside
 * - Athlete assignment inline within each boat
 * - Segmented time input for boat finish times
 * - Global athlete tracking to prevent double-assignment
 * - Side preference guidance for athlete selection
 */

import React, { useState, useMemo } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAthletes } from '@v2/hooks/useAthletes';
import { SeatSlotSelector } from './SeatSlotSelector';
import { SegmentedTimeInput, toSeconds, type TimeSegments } from './SegmentedTimeInput';
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
  shellName: string | null;
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
 * BoatCard - Individual boat within a piece with time entry and athlete assignments
 */
interface BoatCardProps {
  pieceIndex: number;
  boatIndex: number;
  boat: BoatFormData;
  seatConfig: BoatSeatConfig;
  athletes: Athlete[];
  assignedAthleteIds: Set<string>;
  onRemove: () => void;
}

function BoatCard({
  pieceIndex,
  boatIndex,
  boat,
  seatConfig,
  athletes,
  assignedAthleteIds,
  onRemove,
}: BoatCardProps) {
  const { register, setValue, watch } = useFormContext<SessionFormData>();
  const fieldPrefix = `pieces.${pieceIndex}.boats.${boatIndex}`;

  const assignments = watch(`${fieldPrefix}.assignments`) || [];
  const finishTimeSeconds = watch(`${fieldPrefix}.finishTimeSeconds`);

  // Generate seat slots based on boat class
  const seatSlots = useMemo(() => generateSeatSlots(seatConfig), [seatConfig]);

  const handleTimeChange = (segments: TimeSegments) => {
    const totalSeconds = toSeconds(segments);
    setValue(`${fieldPrefix}.finishTimeSeconds`, totalSeconds > 0 ? totalSeconds : null);
  };

  const handleAssign = (
    seatNumber: number,
    side: 'Port' | 'Starboard' | 'Cox',
    athleteId: string | null
  ) => {
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

  const assignmentCount = assignments.length;
  const totalSeats = seatSlots.length;

  return (
    <div className="border border-bdr-default rounded-lg p-4 bg-bg-elevated">
      {/* Boat Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <input
            {...register(`${fieldPrefix}.name`)}
            placeholder="Boat name (e.g., Boat A)"
            className="px-3 py-1.5 text-sm bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-interactive-primary text-txt-primary"
          />
          <span className="text-xs text-txt-tertiary">
            {assignmentCount}/{totalSeats} seats
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-txt-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
          title="Remove boat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Time Entry */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-txt-secondary mb-2">Finish Time</label>
        <SegmentedTimeInput value={finishTimeSeconds} onChange={handleTimeChange} />
      </div>

      {/* Athlete Assignments */}
      <div>
        <label className="block text-xs font-medium text-txt-secondary mb-2">
          Athlete Assignments
        </label>
        <div className="space-y-2">
          {seatSlots.map((slot) => {
            const assignment = assignments.find((a) => a.seatNumber === slot.seatNumber);
            // Don't disable the current assignment's athlete
            const disabledIds = Array.from(assignedAthleteIds).filter(
              (id) => id !== assignment?.athleteId
            );

            return (
              <div key={slot.seatNumber} className="flex items-center gap-3">
                <span className="w-20 text-sm text-txt-secondary font-medium">{slot.label}</span>
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
    </div>
  );
}

/**
 * PieceCard - Collapsible card containing piece metadata and boats
 */
interface PieceCardProps {
  pieceIndex: number;
  seatConfig: BoatSeatConfig;
  athletes: Athlete[];
  assignedAthleteIds: Set<string>;
  onRemove: () => void;
}

function PieceCard({
  pieceIndex,
  seatConfig,
  athletes,
  assignedAthleteIds,
  onRemove,
}: PieceCardProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SessionFormData>();
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    fields: boats,
    append: addBoat,
    remove: removeBoat,
  } = useFieldArray({
    control,
    name: `pieces.${pieceIndex}.boats`,
  });

  const handleAddBoat = () => {
    if (boats.length >= 4) return; // Max 4 boats per piece
    const nextLetter = String.fromCharCode(65 + boats.length); // A, B, C, D
    addBoat({
      name: `Boat ${nextLetter}`,
      finishTimeSeconds: null,
      handicapSeconds: 0,
      shellName: null,
      assignments: [],
    });
  };

  const pieceErrors = errors?.pieces?.[pieceIndex];

  return (
    <div className="border border-bdr-default rounded-lg bg-bg-surface">
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-bdr-subtle">
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-bg-hover rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-txt-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-txt-tertiary" />
            )}
          </button>
          <h4 className="text-sm font-semibold text-txt-primary">Piece #{pieceIndex + 1}</h4>
          <span className="text-xs text-txt-tertiary">
            {boats.length} boat{boats.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-txt-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
          title="Remove piece"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Card Body */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Piece Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1">
                Distance (meters)
              </label>
              <input
                {...register(`pieces.${pieceIndex}.distanceMeters`, {
                  valueAsNumber: true,
                })}
                type="number"
                placeholder="500"
                className="w-full px-3 py-1.5 text-sm bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-interactive-primary text-txt-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1">Direction</label>
              <select
                {...register(`pieces.${pieceIndex}.direction`)}
                className="w-full px-3 py-1.5 text-sm bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-interactive-primary text-txt-primary"
              >
                <option value="">Select...</option>
                <option value="upstream">Upstream</option>
                <option value="downstream">Downstream</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1">Notes</label>
              <input
                {...register(`pieces.${pieceIndex}.notes`)}
                type="text"
                placeholder="Optional notes"
                className="w-full px-3 py-1.5 text-sm bg-bg-raised border border-bdr-default rounded-md focus:outline-none focus:ring-2 focus:ring-interactive-primary text-txt-primary"
              />
            </div>
          </div>

          {/* Boats Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-txt-secondary">Boats</label>
              <button
                type="button"
                onClick={handleAddBoat}
                disabled={boats.length >= 4}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-interactive-primary hover:bg-interactive-primary/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" />
                Add Boat
              </button>
            </div>

            {/* Boat List */}
            <div className="space-y-3">
              {boats.length === 0 ? (
                <div className="text-sm text-txt-tertiary text-center py-4 bg-bg-raised rounded-md border border-bdr-subtle">
                  Add at least 2 boats to race
                </div>
              ) : (
                boats.map((boat, boatIndex) => (
                  <BoatCard
                    key={boat.id}
                    pieceIndex={pieceIndex}
                    boatIndex={boatIndex}
                    boat={boat as BoatFormData}
                    seatConfig={seatConfig}
                    athletes={athletes}
                    assignedAthleteIds={assignedAthleteIds}
                    onRemove={() => removeBoat(boatIndex)}
                  />
                ))
              )}
            </div>

            {/* Validation Error */}
            {pieceErrors?.boats && (
              <p className="text-xs text-red-500 mt-1">{pieceErrors.boats.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no pieces
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-bg-surface rounded-lg border-2 border-dashed border-bdr-default">
      <svg
        className="w-12 h-12 text-txt-tertiary mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      <p className="text-sm text-txt-secondary">{message}</p>
    </div>
  );
}

/**
 * Main PiecesAndAthletesStep component (Wizard Step 2)
 */
export function PiecesAndAthletesStep() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<SessionFormData>();
  const { data: athletes = [], isLoading } = useAthletes();

  const {
    fields: pieces,
    append: addPiece,
    remove: removePiece,
  } = useFieldArray({
    control,
    name: 'pieces',
  });

  const boatClass = watch('boatClass');
  const allPieces = watch('pieces') || [];

  // Determine seats needed based on boat class
  const seatConfig = useMemo(() => getBoatSeatConfig(boatClass), [boatClass]);

  // Track all assigned athletes across all boats to prevent double-assignment
  const assignedAthleteIds = useMemo(() => {
    const ids = new Set<string>();
    allPieces.forEach((piece) => {
      piece.boats?.forEach((boat) => {
        boat.assignments?.forEach((a) => ids.add(a.athleteId));
      });
    });
    return ids;
  }, [allPieces]);

  const handleAddPiece = () => {
    const nextLetter = String.fromCharCode(65 + Math.min(pieces.length * 2, 6)); // A, C, E, G
    addPiece({
      sequenceOrder: pieces.length + 1,
      distanceMeters: 500,
      direction: null,
      notes: '',
      boats: [
        {
          name: `Boat ${nextLetter}`,
          finishTimeSeconds: null,
          handicapSeconds: 0,
          shellName: null,
          assignments: [],
        },
        {
          name: `Boat ${String.fromCharCode(nextLetter.charCodeAt(0) + 1)}`,
          finishTimeSeconds: null,
          handicapSeconds: 0,
          shellName: null,
          assignments: [],
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-txt-secondary">Loading athletes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-txt-primary">Pieces & Athletes</h3>
          <p className="text-sm text-txt-secondary mt-1">
            Add race pieces, configure boats, and assign athletes
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddPiece}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Piece
        </button>
      </div>

      {/* Piece List */}
      {pieces.length > 0 ? (
        <div className="space-y-4">
          {pieces.map((piece, index) => (
            <PieceCard
              key={piece.id}
              pieceIndex={index}
              seatConfig={seatConfig}
              athletes={athletes}
              assignedAthleteIds={assignedAthleteIds}
              onRemove={() => removePiece(index)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="Add at least one piece to continue" />
      )}

      {/* Global validation error */}
      {errors.pieces && typeof errors.pieces.message === 'string' && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.pieces.message}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-txt-tertiary bg-bg-elevated rounded-lg p-4">
        <p className="font-medium text-txt-secondary mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Athletes can only be assigned to one seat at a time</li>
          <li>Seat side preferences are highlighted for guidance</li>
          <li>Partial lineups are allowed - you can leave seats empty</li>
          <li>Collapse pieces to reduce scrolling (click the chevron)</li>
        </ul>
      </div>
    </div>
  );
}
