import React, { useState, useMemo } from 'react';
import AthleteCard from './AthleteCard';
import useLineupStore from '../../store/lineupStore';
import { getAssignedAthletes } from '../../utils/boatConfig';
import ErgDataModal from '../ErgData/ErgDataModal';

/**
 * Athlete Bank component
 * Displays all available athletes for selection and assignment
 * Includes filtering and search capabilities
 */
const AthleteBank = () => {
  const { athletes, activeBoats, selectAthlete, selectedAthlete, clearAthleteSelection } = useLineupStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState('all'); // all, port, starboard, sculling, coxswain
  const [ergDataAthlete, setErgDataAthlete] = useState(null);

  const assignedAthletes = useMemo(() => {
    return getAssignedAthletes(activeBoats);
  }, [activeBoats]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (athlete.firstName && athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Side filter
      let matchesSide = true;
      if (sideFilter === 'port') {
        matchesSide = athlete.port === 1;
      } else if (sideFilter === 'starboard') {
        matchesSide = athlete.starboard === 1;
      } else if (sideFilter === 'sculling') {
        matchesSide = athlete.sculling === 1;
      } else if (sideFilter === 'coxswain') {
        matchesSide = athlete.isCoxswain === 1;
      }

      return matchesSearch && matchesSide;
    });
  }, [athletes, searchTerm, sideFilter]);

  const availableCount = filteredAthletes.filter(a => !assignedAthletes.has(a.id)).length;
  const assignedCount = assignedAthletes.size;

  const handleAthleteDoubleClick = (athlete) => {
    setErgDataAthlete(athlete);
  };

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col animate-fade-in sticky top-24">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple bg-clip-text text-transparent mb-2">
          Athlete Roster
        </h2>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {athletes.length}</span>
          <span>Available: {availableCount}</span>
          <span>Assigned: {assignedCount}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-accent-blue focus:border-transparent bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
        />
      </div>

      {/* Selected Athlete Actions */}
      {selectedAthlete && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {selectedAthlete.firstName} {selectedAthlete.lastName}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Click a seat to assign
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setErgDataAthlete(selectedAthlete)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-all"
                title="View erg data"
              >
                Erg Data
              </button>
              <button
                onClick={clearAthleteSelection}
                className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSideFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sideFilter === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } hover:scale-105 active:scale-95`}
        >
          All
        </button>
        <button
          onClick={() => setSideFilter('port')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sideFilter === 'port'
              ? 'bg-port text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } hover:scale-105 active:scale-95`}
          title="Filter by Port capability (needs full athlete data)"
        >
          Port
        </button>
        <button
          onClick={() => setSideFilter('starboard')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sideFilter === 'starboard'
              ? 'bg-starboard text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } hover:scale-105 active:scale-95`}
          title="Filter by Starboard capability (needs full athlete data)"
        >
          Starboard
        </button>
        <button
          onClick={() => setSideFilter('sculling')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sideFilter === 'sculling'
              ? 'bg-purple-600 dark:bg-accent-purple text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } hover:scale-105 active:scale-95`}
          title="Filter by Sculling capability (needs full athlete data)"
        >
          Sculling
        </button>
        <button
          onClick={() => setSideFilter('coxswain')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            sideFilter === 'coxswain'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-accent-purple dark:to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } hover:scale-105 active:scale-95`}
          title="Filter for Coxswains"
        >
          Coxswain
        </button>
      </div>

      {/* Athletes list */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1.5">
          {filteredAthletes.map(athlete => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              isAssigned={assignedAthletes.has(athlete.id)}
              onClick={selectAthlete}
              onDoubleClick={handleAthleteDoubleClick}
            />
          ))}
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No athletes found matching filters
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">
          <strong className="text-gray-800 dark:text-gray-300">To assign:</strong> Click athlete, then click empty seat
        </p>
        <p className="mb-1">
          <strong className="text-gray-800 dark:text-gray-300">To swap:</strong> Click two filled seats
        </p>
        <p>
          <strong className="text-gray-800 dark:text-gray-300">Erg data:</strong> Double-click athlete or select and click "Erg Data"
        </p>
      </div>

      {/* Erg Data Modal */}
      <ErgDataModal
        athlete={ergDataAthlete}
        isOpen={ergDataAthlete !== null}
        onClose={() => setErgDataAthlete(null)}
      />
    </div>
  );
};

export default AthleteBank;
