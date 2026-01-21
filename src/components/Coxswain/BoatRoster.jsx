import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * BoatRoster - Coxswain's quick view of assigned athletes
 *
 * Displays the current boat lineup in a two-column format (8|4, 7|3, etc.)
 * with port/starboard color coding and boat switching capability.
 *
 * @param {Object} boat - Active boat object with seats and coxswain
 * @param {Array} boats - Array of boats where user is coxswain (for switching)
 * @param {Function} onBoatSwitch - Callback when switching boats
 * @param {Function} onAthleteClick - Callback for athlete details
 */
export function BoatRoster({
  boat,
  boats = [],
  onBoatSwitch,
  onAthleteClick,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!boat) {
    return (
      <div className="bg-void-elevated border border-white/[0.06] rounded-lg p-4">
        <p className="text-text-muted text-sm">No boat assigned</p>
      </div>
    );
  }

  const { name, seats = [], coxswain } = boat;
  const seatCount = seats.length;
  const halfSeats = Math.ceil(seatCount / 2);

  // Create paired seat layout (e.g., 8|4, 7|3, 6|2, 5|1 for an 8+)
  const seatPairs = [];
  for (let i = 0; i < halfSeats; i++) {
    const highSeat = seats[i];
    const lowSeat = seats[i + halfSeats];
    seatPairs.push({ high: highSeat, low: lowSeat });
  }

  const getSideColor = (side) => {
    if (side === 'P' || side === 'Port') return 'text-danger-red';
    if (side === 'S' || side === 'Starboard') return 'text-starboard';
    return 'text-text-secondary';
  };

  const getSideLabel = (side) => {
    if (side === 'P' || side === 'Port') return 'P';
    if (side === 'S' || side === 'Starboard') return 'S';
    return '';
  };

  const handleAthleteClick = (athlete) => {
    if (onAthleteClick && athlete) {
      onAthleteClick(athlete);
    }
  };

  return (
    <div className="bg-void-elevated border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header with boat name and switcher */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="relative" ref={dropdownRef}>
          {boats.length > 1 ? (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 font-display text-sm font-semibold text-text-primary uppercase tracking-wider hover:text-blade-blue transition-colors duration-150"
            >
              {name}
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform duration-150 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <span className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
              {name}
            </span>
          )}

          {/* Boat switcher dropdown */}
          {dropdownOpen && boats.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-void-surface border border-white/[0.08] rounded-lg shadow-2xl z-20 py-1 animate-fade-in">
              {boats.map((b) => (
                <button
                  key={b.id || b.name}
                  onClick={() => {
                    onBoatSwitch?.(b);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-100 ${
                    b.id === boat.id || b.name === boat.name
                      ? 'bg-blade-blue/10 text-blade-blue'
                      : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                  }`}
                >
                  {(b.id === boat.id || b.name === boat.name) && (
                    <Check size={14} className="text-blade-blue" />
                  )}
                  <span className={b.id === boat.id || b.name === boat.name ? '' : 'pl-5'}>
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {boats.length > 1 && (
          <span className="text-[10px] text-text-muted uppercase tracking-wider">
            Switch
          </span>
        )}
      </div>

      {/* Roster content */}
      <div className="p-4 space-y-3">
        {/* Coxswain */}
        {coxswain && (
          <div
            onClick={() => handleAthleteClick(coxswain)}
            className={`flex items-center gap-2 ${
              onAthleteClick ? 'cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded transition-colors duration-100' : ''
            }`}
          >
            <span className="text-xs text-coxswain-violet font-medium uppercase tracking-wider w-10">
              Cox
            </span>
            <span className="text-sm text-text-primary font-medium">
              {coxswain.name || coxswain}
            </span>
          </div>
        )}

        {/* Seat pairs in two columns */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {seatPairs.map((pair, index) => (
            <div key={index} className="contents">
              {/* High seat (e.g., 8, 7, 6, 5) */}
              <SeatRow
                seat={pair.high}
                onClick={() => handleAthleteClick(pair.high?.athlete)}
                getSideColor={getSideColor}
                getSideLabel={getSideLabel}
                clickable={!!onAthleteClick}
              />
              {/* Low seat (e.g., 4, 3, 2, 1) */}
              <SeatRow
                seat={pair.low}
                onClick={() => handleAthleteClick(pair.low?.athlete)}
                getSideColor={getSideColor}
                getSideLabel={getSideLabel}
                clickable={!!onAthleteClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeatRow({ seat, onClick, getSideColor, getSideLabel, clickable }) {
  if (!seat) return <div />;

  const { number, athlete, side } = seat;
  const athleteName = athlete?.name || athlete || 'Empty';
  const sideLabel = getSideLabel(side);

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`flex items-center gap-2 py-1 ${
        clickable ? 'cursor-pointer hover:bg-white/[0.02] -mx-1 px-1 rounded transition-colors duration-100' : ''
      }`}
    >
      <span className="text-xs text-text-muted font-mono w-4 text-right">
        {number}:
      </span>
      <span className="text-sm text-text-primary flex-1 truncate">
        {athleteName}
      </span>
      {sideLabel && (
        <span className={`text-[10px] font-medium ${getSideColor(side)}`}>
          ({sideLabel})
        </span>
      )}
    </div>
  );
}

export default BoatRoster;
