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
      className="glass-card rounded-2xl p-5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer animate-scale-in group"
    >
      <div className="flex items-center justify-between">
        {/* Left: Boat info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple bg-clip-text text-transparent">
              {boat.shellName || boat.boatClass}
            </h3>
            {boat.shellName && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({boat.boatClass})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {filledSeats}/{boat.numSeats}
            </span>
            {boat.hasCoxswain && (
              <span className={`flex items-center gap-1 ${hasCoxswain ? 'text-green-600 dark:text-green-400' : ''}`}>
                Cox {hasCoxswain ? '✓' : '–'}
              </span>
            )}
            {complete && (
              <span className="px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold backdrop-blur-sm">
                Complete ✓
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            className="text-blue-600 dark:text-accent-blue hover:text-blue-700 text-sm font-medium px-3 py-1.5 hover:bg-blue-500/10 dark:hover:bg-accent-blue/10 rounded-lg transition opacity-0 group-hover:opacity-100"
          >
            Expand →
          </button>
          <button
            onClick={handleRemoveBoat}
            className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg p-1.5 transition"
            title="Remove boat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lineup Display */}
      <div className="mt-4 space-y-2">
        {/* Coxswain */}
        {boat.hasCoxswain && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 dark:bg-accent-purple/20 rounded-lg border border-purple-200 dark:border-purple-500/30">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 min-w-[3rem]">COX</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {boat.coxswain ? `${boat.coxswain.lastName}${boat.coxswain.firstName ? `, ${boat.coxswain.firstName}` : ''}` : '—'}
            </span>
          </div>
        )}

        {/* Seats - Show in vertical order (Stroke to Bow) */}
        <div className="grid grid-cols-2 gap-2">
          {[...boat.seats].reverse().map((seat) => {
            const sideColor = seat.side === 'Port'
              ? 'bg-port/10 border-port/30 text-port'
              : 'bg-starboard/10 border-starboard/30 text-starboard';

            return (
              <div
                key={seat.seatNumber}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${sideColor}`}
              >
                <span className="text-xs font-bold min-w-[2rem]">
                  {seat.seatNumber}{seat.side === 'Port' ? 'P' : 'S'}
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {seat.athlete ? seat.athlete.lastName : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompactBoatView;
