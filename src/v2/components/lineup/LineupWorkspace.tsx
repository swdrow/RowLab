import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import useLineupStore from '@/store/lineupStore';
import { useLineupKeyboard } from '@v2/hooks/useLineupKeyboard';
import { AthleteBank } from './AthleteBank';
import { BoatView } from './BoatView';
import { AddBoatButton } from './AddBoatButton';
import { LineupToolbar } from './LineupToolbar';
import { BiometricsPanel } from './BiometricsPanel';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import type { Athlete } from '@v2/types/lineup';
import type { AthleteSource } from './DraggableAthleteCard';

/**
 * Props for LineupWorkspace
 */
interface LineupWorkspaceProps {
  className?: string;
}

/**
 * LineupWorkspace - Main workspace container with drag-drop context
 *
 * Features:
 * - DndContext with sensors for mouse, touch, keyboard
 * - DragOverlay shows full athlete card at cursor during drag
 * - AUTO-SWAP logic: dropping on occupied seat exchanges positions
 * - Handles bank-to-seat, seat-to-seat, seat-to-bank operations
 * - State changes tracked by undo middleware in lineupStore
 * - Undo/redo via toolbar buttons and keyboard shortcuts
 *
 * Auto-swap behavior per CONTEXT.md:
 * "Dropping on occupied seat triggers auto-swap - athletes exchange places automatically"
 *
 * Per RESEARCH.md:
 * "Track source position BEFORE state change to properly swap"
 */
export function LineupWorkspace({ className = '' }: LineupWorkspaceProps) {
  const activeBoats = useLineupStore((state) => state.activeBoats);
  const assignToSeat = useLineupStore((state) => state.assignToSeat);
  const assignToCoxswain = useLineupStore((state) => state.assignToCoxswain);
  const removeFromSeat = useLineupStore((state) => state.removeFromSeat);
  const removeFromCoxswain = useLineupStore((state) => state.removeFromCoxswain);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null);
  const [activeSource, setActiveSource] = useState<AthleteSource | null>(null);

  // Enable keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  useLineupKeyboard();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms hold before drag starts
        tolerance: 5, // 5px tolerance for movement
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current;

    if (data?.athlete) {
      setActiveId(active.id as string);
      setActiveAthlete(data.athlete);
      setActiveSource(data.source);
    }
  }

  // Handle drag end with AUTO-SWAP logic
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Clear active state
    setActiveId(null);
    setActiveAthlete(null);
    setActiveSource(null);

    if (!over) return; // Dropped outside any drop zone

    const draggedAthlete = active.data.current?.athlete;
    const sourcePosition = active.data.current?.source as AthleteSource;
    const targetData = over.data.current;

    if (!draggedAthlete || !sourcePosition || !targetData) return;

    const targetBoatId = targetData.boatId;
    const targetIsCoxswain = targetData.isCoxswain;
    const targetSeat = targetData.seat;

    // Get current athlete at target position
    let occupiedAthlete: Athlete | null = null;
    if (targetIsCoxswain) {
      const targetBoat = activeBoats.find((b) => b.id === targetBoatId);
      occupiedAthlete = targetBoat?.coxswain || null;
    } else {
      occupiedAthlete = targetSeat?.athlete || null;
    }

    // AUTO-SWAP LOGIC
    if (occupiedAthlete) {
      // Target seat is occupied - swap athletes

      // Step 1: Remove dragged athlete from source (if from seat)
      if (sourcePosition.type === 'seat' && sourcePosition.boatId && sourcePosition.seatNumber) {
        removeFromSeat(sourcePosition.boatId, sourcePosition.seatNumber);
      } else if (sourcePosition.type === 'coxswain' && sourcePosition.boatId) {
        removeFromCoxswain(sourcePosition.boatId);
      }

      // Step 2: Place occupied athlete in source position (if source was a seat)
      if (sourcePosition.type === 'seat' && sourcePosition.boatId && sourcePosition.seatNumber) {
        assignToSeat(sourcePosition.boatId, sourcePosition.seatNumber, occupiedAthlete);
      } else if (sourcePosition.type === 'coxswain' && sourcePosition.boatId) {
        assignToCoxswain(sourcePosition.boatId, occupiedAthlete);
      }
      // If source was bank, occupied athlete goes to bank (implicitly by being removed)

      // Step 3: Place dragged athlete in target position
      if (targetIsCoxswain) {
        assignToCoxswain(targetBoatId, draggedAthlete);
      } else if (targetSeat) {
        assignToSeat(targetBoatId, targetSeat.seatNumber, draggedAthlete);
      }
    } else {
      // Target seat is empty - simple assignment

      // Step 1: Remove dragged athlete from source (if from seat)
      if (sourcePosition.type === 'seat' && sourcePosition.boatId && sourcePosition.seatNumber) {
        removeFromSeat(sourcePosition.boatId, sourcePosition.seatNumber);
      } else if (sourcePosition.type === 'coxswain' && sourcePosition.boatId) {
        removeFromCoxswain(sourcePosition.boatId);
      }

      // Step 2: Assign to target
      if (targetIsCoxswain) {
        assignToCoxswain(targetBoatId, draggedAthlete);
      } else if (targetSeat) {
        assignToSeat(targetBoatId, targetSeat.seatNumber, draggedAthlete);
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`flex h-full ${className}`}>
        {/* Athlete Bank - Left Sidebar */}
        <AthleteBank />

        {/* Main Workspace - Boats */}
        <div className="flex-1 overflow-y-auto p-6 bg-bg-base">
          {/* Toolbar with undo/redo and future action buttons */}
          <div className="mb-4">
            <LineupToolbar />
          </div>

          {/* Biometrics Panel - Live stats for current lineup */}
          {activeBoats.length > 0 && (
            <div className="mb-4">
              <BiometricsPanel />
            </div>
          )}

          {/* Add Boat Button */}
          <div className="mb-6">
            <AddBoatButton />
          </div>

          {/* Empty State */}
          {activeBoats.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium text-txt-secondary mb-2">No boats in workspace</p>
                <p className="text-sm text-txt-tertiary">
                  Click the button above to add a boat and start building your lineup
                </p>
              </div>
            </div>
          )}

          {/* Boats */}
          <div className="space-y-6">
            {activeBoats.map((boat) => (
              <BoatView key={boat.id} boat={boat} />
            ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay - Shows full athlete card at cursor */}
      <DragOverlay>
        {activeAthlete && activeSource ? (
          <div className="bg-bg-surface border border-bdr-default rounded-lg shadow-lg">
            <DraggableAthleteCard athlete={activeAthlete} source={activeSource} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default LineupWorkspace;
