import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useLineupStore from '../../store/lineupStore';
import { getCountryFlag } from '../../utils/fileLoader';

/**
 * Individual athlete card component
 * Displays athlete photo, name, country, and status
 * Draggable for assignment to boats
 */
const AthleteCard = ({ athlete, isAssigned, onClick }) => {
  const { selectedAthlete, headshotMap } = useLineupStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `athlete-${athlete.id}`,
    data: {
      athlete,
      type: 'athlete'
    },
    disabled: isAssigned
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const isSelected = selectedAthlete?.id === athlete.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isAssigned && onClick(athlete)}
      className={`
        relative flex flex-col items-center p-3 rounded-lg border-2
        transition-all duration-200
        ${isAssigned
          ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200'
          : 'cursor-pointer bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
        }
        ${isSelected ? 'ring-4 ring-blue-500 border-blue-500' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Headshot */}
      <img
        src={headshotMap.get(athlete.id) || '/images/placeholder-avatar.svg'}
        alt={athlete.lastName}
        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 mb-2"
        draggable={false}
      />

      {/* Name */}
      <div className="text-sm font-semibold text-center leading-tight mb-1">
        {athlete.lastName}
        {athlete.firstName && (
          <div className="text-xs text-gray-600 font-normal">
            {athlete.firstName}
          </div>
        )}
      </div>

      {/* Country flag */}
      {athlete.country && (
        <div className="text-lg" title={athlete.country}>
          {getCountryFlag(athlete.country) || athlete.country}
        </div>
      )}

      {/* Assigned indicator */}
      {isAssigned && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          ✓
        </div>
      )}

      {/* Future: Ranking badge placeholder */}
      {/* <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
        #1
      </div> */}
    </div>
  );
};

export default AthleteCard;
