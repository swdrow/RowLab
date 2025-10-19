import React, { useState } from 'react';
import useLineupStore from '../../store/lineupStore';
import BoatSelectionModal from './BoatSelectionModal';

/**
 * Control panel for boat workspace
 * Add boats with modal, swap athletes, manage lineup
 */
const AssignmentControls = () => {
  const {
    boatConfigs,
    shells,
    lineupName,
    selectedAthlete,
    selectedSeats,
    addBoat,
    setLineupName,
    clearAthleteSelection,
    clearSeatSelection,
    swapAthletes,
    exportLineup,
    saveLineup,
    activeBoats
  } = useLineupStore();

  const [showBoatModal, setShowBoatModal] = useState(false);

  const handleBoatSelect = (boatConfig, shellName) => {
    addBoat(boatConfig, shellName);
    setShowBoatModal(false);
  };

  const handleSwap = () => {
    swapAthletes();
  };

  const handleExport = () => {
    const lineup = exportLineup();
    const blob = new Blob([JSON.stringify(lineup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineup-${lineupName.replace(/\s+/g, '-') || new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const name = lineupName || prompt('Enter lineup name:');
    if (name) {
      saveLineup(name);
      alert(`Lineup "${name}" saved to browser storage`);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
        <h2 className="text-xl font-bold text-rowing-blue mb-4">Lineup Manager</h2>

        {/* Lineup Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Lineup Name
          </label>
          <input
            type="text"
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            placeholder="e.g., Practice 2025-10-19"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Add Boat Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowBoatModal(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + Add Boat to Lineup
          </button>
        </div>

        {/* Selection Status */}
        {selectedAthlete && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-semibold text-blue-900 mb-1">
              Athlete Selected
            </div>
            <div className="text-sm text-blue-700">
              {selectedAthlete.lastName} {selectedAthlete.firstName}
            </div>
            <button
              onClick={clearAthleteSelection}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Swap Controls */}
        {selectedSeats.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm font-semibold text-yellow-900 mb-1">
              Seats Selected: {selectedSeats.length}/2
            </div>
            <div className="flex gap-2 mt-2">
              {selectedSeats.length === 2 && (
                <button
                  onClick={handleSwap}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm font-medium"
                >
                  Swap Athletes
                </button>
              )}
              <button
                onClick={clearSeatSelection}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Lineup Actions */}
        {activeBoats.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lineup Actions</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Save Lineup
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Export JSON
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Workspace</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Active boats: {activeBoats.length}</div>
          </div>
        </div>
      </div>

      {/* Boat Selection Modal */}
      {showBoatModal && (
        <BoatSelectionModal
          boatConfigs={boatConfigs}
          shells={shells}
          onSelect={handleBoatSelect}
          onCancel={() => setShowBoatModal(false)}
        />
      )}
    </>
  );
};

export default AssignmentControls;
