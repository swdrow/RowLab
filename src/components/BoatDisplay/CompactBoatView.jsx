import React from 'react';
import useLineupStore from '../../store/lineupStore';
import { isBoatComplete } from '../../utils/boatConfig';

/**
 * Compact view of a boat showing just essential info
 * Click to expand to full view with headshots
 */
const CompactBoatView = ({ boat, onExpand }) => {
  const { removeBoat } = useLineupStore();
  const complete = isBoatComplete(boat);

  // Count filled seats
  const filledSeats = boat.seats.filter(s => s.athlete !== null).length;
  const hasCoxswain = boat.hasCoxswain && boat.coxswain !== null;

  const handleRemoveBoat = (e) => {
    e.stopPropagation(); // Prevent expanding when clicking remove
    if (confirm(`Remove ${boat.shellName || boat.boatClass} from lineup?`)) {
      removeBoat(boat.id);
    }
  };

  return (
    <div
      onClick={onExpand}
      className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-200 hover:border-blue-400 transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        {/* Left: Boat info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-rowing-blue">
              {boat.shellName || boat.boatClass}
            </h3>
            {boat.shellName && (
              <span className="text-sm text-gray-500">
                ({boat.boatClass})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span>
              {filledSeats}/{boat.numSeats} seats
            </span>
            {boat.hasCoxswain && (
              <span className={hasCoxswain ? 'text-green-600' : ''}>
                Cox: {hasCoxswain ? '✓' : '–'}
              </span>
            )}
            {complete && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                Complete ✓
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 hover:bg-blue-50 rounded"
          >
            Expand →
          </button>
          <button
            onClick={handleRemoveBoat}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1.5"
            title="Remove boat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              complete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${((filledSeats + (hasCoxswain ? 1 : 0)) / (boat.numSeats + (boat.hasCoxswain ? 1 : 0))) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompactBoatView;
