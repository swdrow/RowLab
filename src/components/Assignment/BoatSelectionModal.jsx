import React, { useState } from 'react';

/**
 * Modal for selecting boat class and shell name
 * Allows user to pick boat type (8+, 4-, etc.) and which actual shell to use
 */
const BoatSelectionModal = ({ boatConfigs, shells, onSelect, onCancel }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedShell, setSelectedShell] = useState(null);
  const [customShellName, setCustomShellName] = useState('');

  const availableShells = selectedClass
    ? shells.filter(shell => shell.boatClass === selectedClass.name)
    : [];

  const handleAdd = () => {
    if (!selectedClass) {
      alert('Please select a boat class');
      return;
    }

    const shellName = selectedShell?.name || customShellName || `${selectedClass.name} - ${Date.now()}`;
    onSelect(selectedClass, shellName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-rowing-blue">Add Boat to Lineup</h2>
          <p className="text-sm text-gray-600 mt-1">Select boat class and shell name</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Boat Class */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              1. Select Boat Class
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {boatConfigs.map(config => (
                <button
                  key={config.id}
                  onClick={() => {
                    setSelectedClass(config);
                    setSelectedShell(null); // Reset shell selection
                  }}
                  className={`
                    px-4 py-3 rounded-lg border-2 font-medium transition
                    ${selectedClass?.id === config.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                    }
                  `}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Shell (if class selected) */}
          {selectedClass && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                2. Select Shell for {selectedClass.name}
              </h3>

              {availableShells.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {availableShells.map(shell => (
                    <button
                      key={shell.id}
                      onClick={() => {
                        setSelectedShell(shell);
                        setCustomShellName('');
                      }}
                      className={`
                        w-full px-4 py-3 rounded-lg border-2 text-left transition
                        ${selectedShell?.id === shell.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 bg-white hover:border-green-400'
                        }
                      `}
                    >
                      <div className="font-semibold">{shell.name}</div>
                      {shell.notes && (
                        <div className="text-sm text-gray-600">{shell.notes}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 mb-4">
                  No shells configured for {selectedClass.name}
                </div>
              )}

              {/* Custom shell name option */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter custom shell name:
                </label>
                <input
                  type="text"
                  value={customShellName}
                  onChange={(e) => {
                    setCustomShellName(e.target.value);
                    setSelectedShell(null);
                  }}
                  placeholder="e.g., Seaweed, Titanic, Phoenix..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedClass}
            className={`
              px-6 py-2 rounded-lg font-medium transition
              ${selectedClass
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Add {selectedClass?.name || 'Boat'} to Lineup
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoatSelectionModal;
