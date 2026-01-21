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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 glass-elevated rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-text-primary">Add Boat to Lineup</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select boat class and shell name</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Boat Class */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
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
                    px-4 py-3 rounded-xl border-2 font-medium transition-all
                    ${selectedClass?.id === config.id
                      ? 'border-blade-blue bg-blade-blue/10 text-blade-blue shadow-lg scale-105'
                      : 'border-gray-300 dark:border-white/10 bg-white dark:bg-void-elevated/50 text-gray-700 dark:text-gray-300 hover:border-white/30 hover:scale-105'
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
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
                        w-full px-4 py-3 rounded-xl border-2 text-left transition-all
                        ${selectedShell?.id === shell.id
                          ? 'border-blade-blue bg-blade-blue/10 shadow-lg scale-[1.02]'
                          : 'border-white/10 bg-void-elevated/50 hover:border-blade-blue/50 hover:scale-[1.01]'
                        }
                      `}
                    >
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{shell.name}</div>
                      {shell.notes && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">{shell.notes}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No shells configured for {selectedClass.name}
                </div>
              )}

              {/* Custom shell name option */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 bg-void-elevated text-text-primary placeholder-text-muted transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass-elevated rounded-b-2xl border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedClass}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${selectedClass
                ? 'bg-blade-blue text-white hover:shadow-lg hover:shadow-glow-blue hover:scale-105 active:scale-95'
                : 'bg-white/5 text-text-muted cursor-not-allowed'
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
