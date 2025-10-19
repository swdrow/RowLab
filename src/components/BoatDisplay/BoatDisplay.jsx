import React from 'react';
import Seat from './Seat';
import CoxswainSeat from './CoxswainSeat';
import useLineupStore from '../../store/lineupStore';
import { isBoatComplete } from '../../utils/boatConfig';

/**
 * Main boat display component
 * Shows the boat name, seats in order (bow to stroke), and completion status
 */
const BoatDisplay = ({ boat }) => {
  const {
    selectedAthlete,
    assignToSeat,
    assignToCoxswain,
    removeFromSeat,
    removeFromCoxswain,
    toggleSeatSelection,
    removeBoat,
    clearAthleteSelection
  } = useLineupStore();

  const complete = isBoatComplete(boat);

  const handleSeatClick = (seatNumber, isCoxswain) => {
    if (selectedAthlete) {
      // Assignment mode
      if (isCoxswain) {
        assignToCoxswain(boat.id, selectedAthlete);
      } else {
        assignToSeat(boat.id, seatNumber, selectedAthlete);
      }
      clearAthleteSelection();
    } else {
      // Selection/swap mode
      toggleSeatSelection(boat.id, seatNumber, isCoxswain);
    }
  };

  const handleRemoveBoat = () => {
    if (confirm(`Remove ${boat.name} from workspace?`)) {
      removeBoat(boat.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-rowing-blue">{boat.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-600">
              {boat.numSeats} seats {boat.hasCoxswain ? '+ cox' : ''}
            </span>
            {complete && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                Complete ✓
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleRemoveBoat}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-2 transition"
          title="Remove boat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Boat visualization */}
      <div className="relative">
        {/* Bow to Stroke direction indicator */}
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
          <span className="font-semibold">← BOW</span>
          <span className="font-semibold">STROKE →</span>
        </div>

        {/* Seats container */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Bow seats first */}
          {boat.seats.map((seat) => (
            <Seat
              key={seat.seatNumber}
              boatId={boat.id}
              seat={seat}
              onSeatClick={(seatNum) => handleSeatClick(seatNum, false)}
            />
          ))}

          {/* Coxswain (stern for 8+, bow for smaller boats) */}
          {boat.hasCoxswain && (
            <CoxswainSeat
              boatId={boat.id}
              coxswain={boat.coxswain}
              onCoxswainClick={() => handleSeatClick(null, true)}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs text-gray-600 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-port rounded-full"></div>
            <span>Port (even seats)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-starboard rounded-full"></div>
            <span>Starboard (odd seats)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoatDisplay;
