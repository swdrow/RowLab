import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useLineupStore from '../../store/lineupStore';

/**
 * Compact athlete card for athlete bank
 * Shows flag, name - no headshot (cleaner UI)
 */
const AthleteCard = ({ athlete, isAssigned, onClick, onDoubleClick }) => {
  const { selectedAthlete } = useLineupStore();

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
      onDoubleClick={() => onDoubleClick && onDoubleClick(athlete)}
      className={`
        relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg border
        transition-all duration-200
        ${isAssigned
          ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          : 'cursor-pointer bg-white dark:bg-dark-card/80 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-accent-blue hover:shadow-md hover:scale-[1.02]'
        }
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-accent-blue border-blue-500 dark:border-accent-blue bg-blue-50 dark:bg-accent-blue/20' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Name - stacked vertically */}
      <div className="text-center min-w-0 w-full">
        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
          {athlete.lastName}
        </div>
        {athlete.firstName && (
          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {athlete.firstName}
          </div>
        )}
      </div>

      {/* Country code */}
      <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
        {athlete.country}
      </div>

      {/* Assigned indicator */}
      {isAssigned && (
        <div className="absolute -top-1 -right-1 bg-blue-500 dark:bg-accent-blue text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-lg">
          ✓
        </div>
      )}
    </div>
  );
};

export default AthleteCard;
