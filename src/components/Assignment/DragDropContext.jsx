import React from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import useLineupStore from '../../store/lineupStore';
import AthleteCard from '../AthleteBank/AthleteCard';

/**
 * Drag and Drop context provider
 * Handles drag events for athlete assignment
 */
const DragDropProvider = ({ children }) => {
  const {
    assignToSeat,
    assignToCoxswain,
    clearAthleteSelection,
    athletes,
    activeBoats
  } = useLineupStore();

  const [activeAthlete, setActiveAthlete] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'athlete') {
      setActiveAthlete(active.data.current.athlete);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveAthlete(null);
      return;
    }

    const athleteData = active.data.current;
    const targetData = over.data.current;

    if (athleteData?.type === 'athlete' && targetData) {
      const athlete = athleteData.athlete;

      if (targetData.type === 'seat') {
        assignToSeat(targetData.boatId, targetData.seatNumber, athlete);
      } else if (targetData.type === 'coxswain') {
        assignToCoxswain(targetData.boatId, athlete);
      }

      clearAthleteSelection();
    }

    setActiveAthlete(null);
  };

  const handleDragCancel = () => {
    setActiveAthlete(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      <DragOverlay>
        {activeAthlete ? (
          <div className="cursor-grabbing">
            <AthleteCard
              athlete={activeAthlete}
              isAssigned={false}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropProvider;
