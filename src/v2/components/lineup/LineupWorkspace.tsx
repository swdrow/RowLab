import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import useLineupStore from '@/store/lineupStore';
import { useLineupDraft } from '@v2/hooks/useLineupDraft';
import {
  useLineupCommands,
  createAssignCommand,
  createSwapCommand,
} from '@v2/hooks/useLineupCommands';
import { useLineupKeyboard } from '@v2/hooks/useLineupKeyboard';
import type { LineupAssignment } from '@v2/hooks/useLineups';
import { AthleteBank } from './AthleteBank';
import { BoatView } from './BoatView';
import { AddBoatButton } from './AddBoatButton';
import { LineupToolbar } from './LineupToolbar';
import { BiometricsPanel } from './BiometricsPanel';
import { DraggableAthleteCard } from './DraggableAthleteCard';
import { MobileLineupBuilder } from './MobileLineupBuilder';
import type { Athlete } from '@v2/types/lineup';
import type { AthleteSource } from './DraggableAthleteCard';

/**
 * Props for LineupWorkspace
 */
interface LineupWorkspaceProps {
  className?: string;
}

/**
 * LineupWorkspace - Main workspace container with responsive desktop/mobile layouts
 *
 * Desktop Features (>768px):
 * - DndContext with sensors for mouse, touch, keyboard
 * - DragOverlay shows full athlete card at cursor during drag
 * - AUTO-SWAP logic: dropping on occupied seat exchanges positions
 * - Handles bank-to-seat, seat-to-seat, seat-to-bank operations
 * - State changes tracked by undo middleware in lineupStore
 * - Undo/redo via toolbar buttons and keyboard shortcuts
 *
 * Mobile Features (≤768px):
 * - Tap-to-select workflow (no drag-drop)
 * - Bottom sheet athlete selector
 * - Full-width boat view (no sidebar)
 * - Bottom action bar with undo/redo
 *
 * Auto-swap behavior per CONTEXT.md:
 * "Dropping on occupied seat triggers auto-swap - athletes exchange places automatically"
 *
 * Responsive behavior per CONTEXT.md:
 * "Full redesign for mobile - different UI entirely for small screens, not just responsive adjustments"
 *
 * Per RESEARCH.md:
 * "Track source position BEFORE state change to properly swap"
 */
export function LineupWorkspace({ className = '' }: LineupWorkspaceProps) {
  // Get currentLineupId from V1 store (migration: will come from route/props later)
  const currentLineupId = useLineupStore((state) => state.currentLineupId);
  const activeBoats = useLineupStore((state) => state.activeBoats);
  const assignToSeat = useLineupStore((state) => state.assignToSeat);
  const assignToCoxswain = useLineupStore((state) => state.assignToCoxswain);
  const removeFromSeat = useLineupStore((state) => state.removeFromSeat);
  const removeFromCoxswain = useLineupStore((state) => state.removeFromCoxswain);

  // V2 hooks for draft management and command-based undo
  const { autoSave, cancelAutoSave } = useLineupDraft(currentLineupId);
  const { executeCommand } = useLineupCommands(currentLineupId, cancelAutoSave);

  const [, setActiveId] = useState<string | null>(null);
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null);
  const [activeSource, setActiveSource] = useState<AthleteSource | null>(null);

  // Mobile detection - 768px breakpoint
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enable keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) with command-based undo
  useLineupKeyboard(currentLineupId, cancelAutoSave);

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

  // Handle drag end with AUTO-SWAP logic and command-based undo
  async function handleDragEnd(event: DragEndEvent) {
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

    // AUTO-SWAP LOGIC with command pattern
    // Note: V1 store operations are still used for immediate UI update
    // Commands trigger autoSave to persist to server via V2 draft system

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

      // Create swap command for undo/redo if both are seats (not bank)
      if (sourcePosition.type !== 'bank' && currentLineupId) {
        const assignment1: LineupAssignment = {
          athleteId: draggedAthlete.id,
          boatClass: targetData.boatClass || '8+', // TODO: get from boat config
          shellName: null,
          seatNumber: targetIsCoxswain ? 0 : targetSeat.seatNumber,
          side: targetIsCoxswain ? 'Port' : targetSeat.side,
          isCoxswain: targetIsCoxswain,
        };
        const assignment2: LineupAssignment = {
          athleteId: occupiedAthlete.id,
          boatClass: targetData.boatClass || '8+',
          shellName: null,
          seatNumber: sourcePosition.type === 'coxswain' ? 0 : sourcePosition.seatNumber!,
          side: sourcePosition.type === 'coxswain' ? 'Port' : targetSeat?.side || 'Port',
          isCoxswain: sourcePosition.type === 'coxswain',
        };
        const swapCmd = createSwapCommand(
          currentLineupId,
          assignment1,
          assignment2,
          async ({ assignment1: a1, assignment2: a2 }) => {
            // Swap mutation: update both assignments via autoSave
            // This is a simplified version - full implementation needs to build complete assignments array
            autoSave({ assignments: [a1, a2] });
          }
        );
        await executeCommand(swapCmd);
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

      // Create assign/remove command for undo/redo
      if (currentLineupId) {
        if (sourcePosition.type === 'bank') {
          // Bank to seat: assign command
          const assignCmd = createAssignCommand(
            currentLineupId,
            draggedAthlete.id,
            targetIsCoxswain ? 0 : targetSeat?.seatNumber || 0,
            targetBoatId,
            targetIsCoxswain,
            async ({ athleteId, seatNumber, boatId, isCoxswain }) => {
              // Assign mutation via autoSave
              const assignment: LineupAssignment = {
                athleteId,
                boatClass: targetData.boatClass || '8+',
                shellName: null,
                seatNumber,
                side: isCoxswain ? 'Port' : targetSeat?.side || 'Port',
                isCoxswain,
              };
              autoSave({ assignments: [assignment] });
            },
            async ({ athleteId, seatNumber, boatId, isCoxswain }) => {
              // Remove mutation via autoSave
              autoSave({ assignments: [] }); // Simplified - should filter out this assignment
            }
          );
          await executeCommand(assignCmd);
        } else {
          // Seat to seat move: create compound command
          // For now, treat as assign to new + remove from old
          const assignCmd = createAssignCommand(
            currentLineupId,
            draggedAthlete.id,
            targetIsCoxswain ? 0 : targetSeat?.seatNumber || 0,
            targetBoatId,
            targetIsCoxswain,
            async ({ athleteId, seatNumber, boatId, isCoxswain }) => {
              const assignment: LineupAssignment = {
                athleteId,
                boatClass: targetData.boatClass || '8+',
                shellName: null,
                seatNumber,
                side: isCoxswain ? 'Port' : targetSeat?.side || 'Port',
                isCoxswain,
              };
              autoSave({ assignments: [assignment] });
            },
            async ({ athleteId, seatNumber, boatId, isCoxswain }) => {
              autoSave({ assignments: [] }); // Simplified
            }
          );
          await executeCommand(assignCmd);
        }
      }
    }
  }

  // Mobile layout - no drag-drop context
  if (isMobile) {
    return (
      <div className={`h-full ${className}`}>
        <MobileLineupBuilder />
      </div>
    );
  }

  // Desktop layout - with drag-drop context
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up ${active.data.current?.athlete?.firstName || 'athlete'} ${active.data.current?.athlete?.lastName || ''}`,
          onDragOver: ({ active, over }) =>
            over
              ? `${active.data.current?.athlete?.firstName || ''} is over ${over.data.current?.isCoxswain ? 'coxswain seat' : `seat ${over.data.current?.seat?.seatNumber || ''}`}`
              : `${active.data.current?.athlete?.firstName || ''} is not over a droppable area`,
          onDragEnd: ({ active, over }) =>
            over
              ? `Assigned ${active.data.current?.athlete?.firstName || ''} to ${over.data.current?.isCoxswain ? 'coxswain seat' : `seat ${over.data.current?.seat?.seatNumber || ''}`}`
              : `${active.data.current?.athlete?.firstName || ''} was not assigned`,
          onDragCancel: ({ active }) =>
            `Assignment cancelled. ${active.data.current?.athlete?.firstName || 'Athlete'} was not moved.`,
        },
        screenReaderInstructions: {
          draggable:
            'Press space or enter to pick up this athlete. Use arrow keys to move to a seat. Press space or enter to drop, or escape to cancel.',
        },
      }}
    >
      {/* Hidden screen reader instructions for keyboard navigation */}
      <div id="seat-drop-instructions" className="sr-only">
        Press arrow keys to navigate between seats. Press space to assign athlete.
      </div>

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
