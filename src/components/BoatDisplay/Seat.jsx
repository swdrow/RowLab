import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import useLineupStore from '../../store/lineupStore';

/**
 * Individual seat component in a boat
 * Displays seat number, side, and assigned athlete
 * Supports click-to-assign and drag-and-drop
 */
const Seat = ({ boatId, seat, onSeatClick }) => {
  const { selectedSeats, headshotMap } = useLineupStore();

  const { setNodeRef, isOver } = useDroppable({
    id: `${boatId}-seat-${seat.seatNumber}`,
    data: {
      boatId,
      seatNumber: seat.seatNumber,
      type: 'seat'
    }
  });

  const isSelected = selectedSeats.some(
    s => s.boatId === boatId && s.seatNumber === seat.seatNumber && !s.isCoxswain
  );

  const sideColor = seat.side === 'Port' ? 'bg-port' : 'bg-starboard';
  const sideColorLight = seat.side === 'Port' ? 'bg-red-100' : 'bg-green-100';

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSeatClick(seat.seatNumber, false)}
      className={`
        relative flex flex-col items-center justify-center
        w-24 h-32 rounded-xl border-2 cursor-pointer
        transition-all duration-200 backdrop-blur-sm
        ${seat.athlete
          ? 'border-white/30 bg-white dark:bg-void-card/90'
          : 'border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-void-elevated/50'
        }
        ${isOver ? 'ring-4 ring-blade-blue scale-105 shadow-xl' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400 dark:ring-yellow-500 shadow-xl' : ''}
        hover:shadow-lg hover:scale-105
      `}
    >
      {/* Seat number badge */}
      <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${sideColor} text-white text-xs font-bold flex items-center justify-center shadow-md`}>
        {seat.seatNumber}
      </div>

      {/* Side indicator */}
      <div className={`absolute -bottom-2 px-2 py-0.5 rounded-full text-xs font-semibold ${sideColorLight} ${seat.side === 'Port' ? 'text-red-700' : 'text-green-700'} shadow-sm`}>
        {seat.side === 'Port' ? 'P' : 'S'}
      </div>

      {/* Athlete or empty state */}
      {seat.athlete ? (
        <div className="flex flex-col items-center space-y-1">
          <div className="relative">
            <img
              src={headshotMap.get(seat.athlete.id) || '/images/placeholder-avatar.svg'}
              alt={seat.athlete.lastName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-md"
            />
            {/* Country flag in bottom right */}
            {seat.athlete.country && (
              <img
                src={`/api/flags/${seat.athlete.country}.png`}
                alt={seat.athlete.country}
                className="absolute -bottom-1 -right-1 w-8 h-5 object-cover rounded-sm shadow-lg border border-white dark:border-gray-800"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="text-xs font-semibold text-center leading-tight text-gray-900 dark:text-gray-100">
            {seat.athlete.lastName}
          </div>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 text-2xl">+</div>
      )}
    </div>
  );
};

export default Seat;
