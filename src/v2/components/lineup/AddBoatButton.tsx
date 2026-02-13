import { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { AddBoatButtonProps, BoatConfig } from '@v2/types/lineup';

/**
 * AddBoatButton - Boat creation UI with dropdown selector
 *
 * Allows coaches to add new boats to the lineup workspace by selecting
 * from available boat classes (8+, 4+, 2x, etc.) with optional shell assignment.
 *
 * Features:
 * - Dropdown with boat class options from props
 * - Displays boat class name and number of seats
 * - Calls parent callback onAddBoat() on selection
 * - Optional shell selector (future enhancement)
 * - Closes automatically after selection
 *
 * Per CONTEXT.md: "Lineup builder allows boat class selection (8+, 4+, 2x, etc.)"
 *
 * V3 Migration: Now prop-driven (boat configs + callback from parent) instead of
 * reading from V1 lineupStore. Parent (LineupWorkspace) handles creating boat
 * and updating draft assignments.
 */
export function AddBoatButton({
  className = '',
  boatConfigs,
  onAddBoat,
}: AddBoatButtonProps & {
  boatConfigs: BoatConfig[];
  onAddBoat: (configId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectBoat = (boatConfig: BoatConfig) => {
    onAddBoat(boatConfig.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Add Boat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          bg-interactive-primary text-white font-medium
          hover:bg-interactive-primary/90
          focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:ring-offset-2
          transition-colors
        "
      >
        <Plus size={20} />
        <span>Add Boat</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div
            className="
              absolute right-0 top-full mt-2 z-20
              w-64 rounded-lg border border-bdr-default
              bg-bg-surface shadow-card-rest overflow-hidden
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-bdr-subtle">
              <h3 className="text-sm font-semibold text-txt-primary">Select Boat Class</h3>
            </div>

            {/* Boat Options */}
            <div className="max-h-80 overflow-y-auto">
              {boatConfigs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-txt-tertiary">No boat configurations available</p>
                  <p className="text-xs text-txt-tertiary mt-1">
                    Contact your admin to set up boat classes
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {boatConfigs.map((config) => (
                    <button
                      key={config.name}
                      onClick={() => handleSelectBoat(config)}
                      className="
                        w-full px-4 py-3 text-left
                        hover:bg-bg-hover
                        transition-colors
                        focus:outline-none focus:bg-bg-hover
                      "
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-txt-primary">{config.name}</div>
                          <div className="text-xs text-txt-tertiary mt-0.5">
                            {config.numSeats} seat{config.numSeats !== 1 ? 's' : ''}
                            {config.hasCoxswain && ' + coxswain'}
                          </div>
                        </div>
                        <Plus size={16} className="text-txt-tertiary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Shell Selector (Future Enhancement) */}
            {/*
            <div className="px-4 py-3 border-t border-bdr-subtle bg-bg-base">
              <p className="text-xs text-txt-tertiary">
                Shell name can be assigned after adding boat
              </p>
            </div>
            */}
          </div>
        </>
      )}
    </div>
  );
}

export default AddBoatButton;
