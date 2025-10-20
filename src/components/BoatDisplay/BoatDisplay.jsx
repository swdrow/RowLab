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
    toggleBoatExpanded,
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
    <div className="glass-card rounded-2xl p-6 animate-scale-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple bg-clip-text text-transparent">
            {boat.shellName || boat.boatClass || boat.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            {boat.shellName && boat.boatClass && (
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {boat.boatClass}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {boat.numSeats} seats {boat.hasCoxswain ? '+ cox' : ''}
            </span>
            {complete && (
              <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold backdrop-blur-sm">
                Complete ✓
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleBoatExpanded(boat.id)}
            className="text-blue-600 dark:text-accent-blue hover:text-blue-700 hover:bg-blue-500/10 dark:hover:bg-accent-blue/10 rounded-lg p-2 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Collapse to compact view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={handleRemoveBoat}
            className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg p-2 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Remove boat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Boat visualization - Vertical layout */}
      <div className="relative flex justify-center">
        {/* Direction indicators on left */}
        <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 mr-4 py-2">
          <span className="font-semibold writing-mode-vertical">STERN</span>
          <span className="font-semibold writing-mode-vertical mt-auto">BOW</span>
        </div>

        {/* Seats container - Vertical arrangement */}
        <div className="flex flex-col items-center gap-3">
          {/* Coxswain at top (stern) */}
          {boat.hasCoxswain && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold w-16 text-right">COX</span>
              <CoxswainSeat
                boatId={boat.id}
                coxswain={boat.coxswain}
                onCoxswainClick={() => handleSeatClick(null, true)}
              />
            </div>
          )}

          {/* Seats from Stroke (highest number) to Bow (1) */}
          {[...boat.seats].reverse().map((seat) => (
            <div key={seat.seatNumber} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold w-16 text-right">
                Seat {seat.seatNumber}
                {seat.seatNumber === boat.numSeats && " (Stroke)"}
                {seat.seatNumber === 1 && " (Bow)"}
              </span>
              <Seat
                boatId={boat.id}
                seat={seat}
                onSeatClick={(seatNum) => handleSeatClick(seatNum, false)}
              />
            </div>
          ))}
        </div>

        {/* Legend on right */}
        <div className="ml-4 flex flex-col gap-3 text-xs text-gray-600 dark:text-gray-400 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-port rounded-full shadow-sm"></div>
            <span>Port</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-starboard rounded-full shadow-sm"></div>
            <span>Starboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoatDisplay;
