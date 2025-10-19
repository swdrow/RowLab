import React, { useState, useMemo } from 'react';
import AthleteCard from './AthleteCard';
import useLineupStore from '../../store/lineupStore';
import { getAssignedAthletes } from '../../utils/boatConfig';

/**
 * Athlete Bank component
 * Displays all available athletes for selection and assignment
 * Includes filtering and search capabilities
 */
const AthleteBank = () => {
  const { athletes, activeBoats, selectAthlete } = useLineupStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState('all'); // all, port, starboard, sculling

  const assignedAthletes = useMemo(() => {
    return getAssignedAthletes(activeBoats);
  }, [activeBoats]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (athlete.firstName && athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Side filter (skeleton - needs full athlete data)
      let matchesSide = true;
      if (sideFilter === 'port') {
        matchesSide = athlete.port === 1;
      } else if (sideFilter === 'starboard') {
        matchesSide = athlete.starboard === 1;
      } else if (sideFilter === 'sculling') {
        matchesSide = athlete.sculling === 1;
      }

      return matchesSearch && matchesSide;
    });
  }, [athletes, searchTerm, sideFilter]);

  const availableCount = filteredAthletes.filter(a => !assignedAthletes.has(a.id)).length;
  const assignedCount = assignedAthletes.size;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-rowing-blue mb-2">
          Athlete Roster
        </h2>
        <div className="flex gap-4 text-sm text-gray-600">
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSideFilter('all')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            sideFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSideFilter('port')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            sideFilter === 'port'
              ? 'bg-port text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Filter by Port capability (needs full athlete data)"
        >
          Port
        </button>
        <button
          onClick={() => setSideFilter('starboard')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            sideFilter === 'starboard'
              ? 'bg-starboard text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Filter by Starboard capability (needs full athlete data)"
        >
          Starboard
        </button>
        <button
          onClick={() => setSideFilter('sculling')}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            sideFilter === 'sculling'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Filter by Sculling capability (needs full athlete data)"
        >
          Sculling
        </button>
      </div>

      {/* Athletes grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredAthletes.map(athlete => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              isAssigned={assignedAthletes.has(athlete.id)}
              onClick={selectAthlete}
            />
          ))}
        </div>

        {filteredAthletes.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No athletes found matching filters
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <p className="mb-1">
          <strong>To assign:</strong> Click athlete, then click empty seat
        </p>
        <p>
          <strong>To swap:</strong> Click two filled seats
        </p>
      </div>
    </div>
  );
};

export default AthleteBank;
