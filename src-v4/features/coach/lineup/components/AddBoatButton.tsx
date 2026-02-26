/**
 * AddBoatButton -- dropdown for adding a new boat to the lineup.
 *
 * Renders a popover-style dropdown with boat class options.
 * Each option shows: boat class, seat count, and coxswain indicator.
 * Hidden when readOnly.
 */
import { useState, useRef, useEffect } from 'react';
import type { BoatClass } from '../types';
import { BOAT_SEAT_COUNTS, BOAT_HAS_COXSWAIN } from '../types';
import { IconPlus } from '@/components/icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddBoatButtonProps {
  onAdd: (config: { boatClass: BoatClass; seatCount: number; hasCoxswain: boolean }) => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Boat class options in typical ordering
// ---------------------------------------------------------------------------

interface BoatOption {
  boatClass: BoatClass;
  label: string;
  seatCount: number;
  hasCoxswain: boolean;
}

const BOAT_OPTIONS: BoatOption[] = [
  { boatClass: '8+', label: 'Eight', seatCount: 8, hasCoxswain: true },
  { boatClass: '4+', label: 'Coxed Four', seatCount: 4, hasCoxswain: true },
  { boatClass: '4x', label: 'Quad', seatCount: 4, hasCoxswain: false },
  { boatClass: '4-', label: 'Straight Four', seatCount: 4, hasCoxswain: false },
  { boatClass: '2x', label: 'Double', seatCount: 2, hasCoxswain: false },
  { boatClass: '2-', label: 'Pair', seatCount: 2, hasCoxswain: false },
  { boatClass: '1x', label: 'Single', seatCount: 1, hasCoxswain: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddBoatButton({ onAdd, readOnly = false }: AddBoatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (readOnly) return null;

  function handleSelect(option: BoatOption) {
    onAdd({
      boatClass: option.boatClass,
      seatCount: BOAT_SEAT_COUNTS[option.boatClass],
      hasCoxswain: BOAT_HAS_COXSWAIN[option.boatClass],
    });
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
          text-sm font-medium
          border-2 border-dashed border-edge-default
          text-text-dim hover:text-accent-teal
          hover:border-accent-teal/40 hover:bg-accent-teal/5
          transition-all duration-150
        "
      >
        <IconPlus width={16} height={16} />
        <span>Add Boat</span>
      </button>

      {isOpen && (
        <div
          className="
            absolute top-full mt-2 left-0 z-30
            w-60 py-1.5 rounded-xl
            panel shadow-xl border border-edge-default
          "
          role="menu"
        >
          {BOAT_OPTIONS.map((option) => (
            <button
              key={option.boatClass}
              role="menuitem"
              onClick={() => handleSelect(option)}
              className="
                w-full flex items-center gap-3 px-3.5 py-2.5
                text-left text-sm
                hover:bg-void-overlay transition-colors duration-75
              "
            >
              {/* Boat class badge */}
              <span className="text-sm font-bold text-accent-teal w-7 text-center flex-shrink-0">
                {option.boatClass}
              </span>

              {/* Label + info */}
              <div className="flex-1 min-w-0">
                <span className="text-text-bright font-medium">{option.label}</span>
                <span className="text-text-faint text-xs ml-2">
                  {option.seatCount} seat{option.seatCount > 1 ? 's' : ''}
                  {option.hasCoxswain ? ' + cox' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
