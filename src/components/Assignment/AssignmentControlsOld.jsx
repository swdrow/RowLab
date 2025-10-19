import React from 'react';
import useLineupStore from '../../store/lineupStore';

/**
 * Control panel for boat workspace
 * Add boats, swap athletes, clear selections, save lineups
 */
const AssignmentControls = () => {
  const {
    boatConfigs,
    selectedAthlete,
    selectedSeats,
    addBoat,
    clearAthleteSelection,
    clearSeatSelection,
    swapAthletes,
    exportLineup,
    saveLineup,
    getSavedLineups,
    activeBoats
  } = useLineupStore();

  const handleAddBoat = (config) => {
    addBoat(config);
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
    a.download = `lineup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const name = prompt('Enter lineup name:');
    if (name) {
      saveLineup(name);
      alert(`Lineup "${name}" saved to browser storage`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      <h2 className="text-xl font-bold text-rowing-blue mb-4">Controls</h2>

      {/* Add Boat Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Boat</h3>
        <div className="grid grid-cols-2 gap-2">
          {boatConfigs.map(config => (
            <button
              key={config.id}
              onClick={() => handleAddBoat(config)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
            >
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selection Status */}
      {selectedAthlete && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
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
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
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
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
            >
              Save Lineup
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium"
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
  );
};

export default AssignmentControls;
