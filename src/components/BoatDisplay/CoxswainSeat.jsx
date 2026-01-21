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
        w-24 h-32 rounded-xl border-2 cursor-pointer
        transition-all duration-200 backdrop-blur-sm
        ${coxswain
          ? 'border-coxswain-violet bg-void-card/90'
          : 'border-white/10 bg-void-elevated/50'
        }
        ${isOver ? 'ring-4 ring-purple-400 dark:ring-coxswain-violet scale-105 shadow-xl' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400 dark:ring-yellow-500 shadow-xl' : ''}
        hover:shadow-lg hover:scale-105
      `}
    >
      {/* Cox badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-coxswain-violet text-white text-xs font-bold flex items-center justify-center shadow-md">
        C
      </div>

      {/* Athlete or empty state */}
      {coxswain ? (
        <div className="flex flex-col items-center space-y-1">
          <div className="relative">
            <img
              src={headshotMap.get(coxswain.id) || '/images/placeholder-avatar.svg'}
              alt={coxswain.lastName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-md"
            />
            {/* Country flag in bottom right */}
            {coxswain.country && (
              <img
                src={`/api/flags/${coxswain.country}.png`}
                alt={coxswain.country}
                className="absolute -bottom-1 -right-1 w-8 h-5 object-cover rounded-sm shadow-lg border border-white dark:border-gray-800"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="text-xs font-semibold text-center leading-tight text-text-primary">
            {coxswain.lastName}
          </div>
        </div>
      ) : (
        <div className="text-text-muted text-2xl">+</div>
      )}

      <div className="absolute -bottom-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-coxswain-violet/20 text-purple-700 dark:text-purple-300 shadow-sm">
        COX
      </div>
    </div>
  );
};

export default CoxswainSeat;
