import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import type { Athlete } from '@v2/types/lineup';

/**
 * Props for MobileAthleteSelector bottom sheet
 */
interface MobileAthleteSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (athlete: Athlete) => void;
  availableAthletes: Athlete[];
  assignedAthleteIds?: Set<string>;
}

/**
 * MobileAthleteSelector - Bottom sheet athlete selector for mobile tap-to-select workflow
 *
 * Features:
 * - Slides up from bottom of screen (~80% height)
 * - Scrollable list of athletes
 * - Search filter at top
 * - Tap athlete to select and close
 * - Swipe down or tap outside to close
 * - Background overlay with opacity
 * - Smooth Framer Motion animations
 *
 * Per CONTEXT.md: "Touch devices use tap-to-select, tap-to-place workflow - no drag on mobile to avoid scroll conflicts"
 */
export function MobileAthleteSelector({
  isOpen,
  onClose,
  onSelect,
  availableAthletes,
  assignedAthleteIds = new Set(),
}: MobileAthleteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter athletes by search query
  const filteredAthletes = availableAthletes.filter((athlete) => {
    const query = searchQuery.toLowerCase();
    return (
      athlete.firstName.toLowerCase().includes(query) ||
      athlete.lastName.toLowerCase().includes(query) ||
      `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(query)
    );
  });

  // Handle athlete selection
  function handleSelect(athlete: Athlete) {
    onSelect(athlete);
    onClose();
    setSearchQuery(''); // Clear search for next time
  }

  // Get side preference badge
  function getSideBadge(athlete: Athlete): { text: string; color: string } {
    if (athlete.side === 'Cox') {
      return { text: 'Cox', color: 'bg-purple-500/10 text-purple-600' };
    } else if (athlete.side === 'Both') {
      return { text: 'Both', color: 'bg-blue-500/10 text-blue-600' };
    } else if (athlete.side === 'Port') {
      return { text: 'Port', color: 'bg-red-500/10 text-red-600' };
    } else if (athlete.side === 'Starboard') {
      return { text: 'Starboard', color: 'bg-green-500/10 text-green-600' };
    }
    return { text: '-', color: 'bg-gray-500/10 text-gray-600' };
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-bg-base rounded-t-2xl shadow-lg z-50 h-[80vh] flex flex-col"
          >
            {/* Handle bar for swipe */}
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-bdr-default rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-bdr-default">
              <h2 className="text-lg font-semibold text-txt-primary">Select Athlete</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-txt-secondary" />
              </button>
            </div>

            {/* Search filter */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search athletes..."
                  className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-bdr-default rounded-lg text-txt-primary placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                />
              </div>
            </div>

            {/* Athletes list - scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredAthletes.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-txt-tertiary">No athletes found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAthletes.map((athlete) => {
                    const isAssigned = assignedAthleteIds.has(athlete.id);
                    const sideBadge = getSideBadge(athlete);
                    return (
                      <button
                        key={athlete.id}
                        onClick={() => handleSelect(athlete)}
                        disabled={isAssigned}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isAssigned
                            ? 'bg-bg-surface opacity-50 cursor-not-allowed'
                            : 'bg-bg-surface hover:bg-bg-hover active:bg-bg-surface/80'
                        }`}
                      >
                        {/* Avatar */}
                        <AthleteAvatar
                          firstName={athlete.firstName}
                          lastName={athlete.lastName}
                          size="md"
                        />

                        {/* Name */}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-txt-primary">
                            {athlete.firstName} {athlete.lastName}
                          </p>
                          {isAssigned && (
                            <p className="text-xs text-txt-tertiary">Already assigned</p>
                          )}
                        </div>

                        {/* Side preference badge */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${sideBadge.color}`}>
                          {sideBadge.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileAthleteSelector;
