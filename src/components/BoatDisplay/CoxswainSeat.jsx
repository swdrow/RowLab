import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import useLineupStore from '../../store/lineupStore';

/**
 * Coxswain position component
 * Similar to Seat but specifically for coxswain
 */
const CoxswainSeat = ({ boatId, coxswain, onCoxswainClick }) => {
  const { selectedSeats, headshotMap } = useLineupStore();

  const { setNodeRef, isOver } = useDroppable({
    id: `${boatId}-coxswain`,
    data: {
      boatId,
      type: 'coxswain'
    }
  });

  const isSelected = selectedSeats.some(
    s => s.boatId === boatId && s.isCoxswain
  );

  return (
    <div
      ref={setNodeRef}
      onClick={onCoxswainClick}
      className={`
        relative flex flex-col items-center justify-center
        w-24 h-32 rounded-lg border-2 cursor-pointer
        transition-all duration-200
        ${coxswain ? 'border-purple-500 bg-white' : 'border-gray-300 bg-gray-50'}
        ${isOver ? 'ring-4 ring-purple-400 scale-105' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400' : ''}
        hover:shadow-lg
      `}
    >
      {/* Cox badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
        C
      </div>

      {/* Athlete or empty state */}
      {coxswain ? (
        <div className="flex flex-col items-center space-y-1">
          <img
            src={headshotMap.get(coxswain.id) || '/images/placeholder-avatar.svg'}
            alt={coxswain.lastName}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          <div className="text-xs font-semibold text-center leading-tight">
            {coxswain.lastName}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-2xl">+</div>
      )}

      <div className="absolute -bottom-2 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
        COX
      </div>
    </div>
  );
};

export default CoxswainSeat;
