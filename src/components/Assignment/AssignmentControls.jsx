import React, { useState } from 'react';
import useLineupStore from '../../store/lineupStore';
import useAuthStore from '../../store/authStore';
import BoatSelectionModal from './BoatSelectionModal';
import SavedLineupsModal from './SavedLineupsModal';
import PDFExportModal from '../Export/PDFExportModal';

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
    activeBoats,
    loadLineupFromData,
    athletes
  } = useLineupStore();

  const { isAuthenticated, getAuthHeaders } = useAuthStore();

  const [showBoatModal, setShowBoatModal] = useState(false);
  const [showSavedLineups, setShowSavedLineups] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    const name = lineupName || prompt('Enter lineup name:');
    if (!name) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (isAuthenticated) {
        // Save to database
        const res = await fetch('/api/lineups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            name,
            boats: activeBoats,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setSaveMessage({ type: 'success', text: `Saved to database` });
      } else {
        // Save to localStorage
        saveLineup(name);
        setSaveMessage({ type: 'success', text: `Saved locally` });
      }
      setLineupName(name);
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleLoadLineup = (lineup) => {
    // Load lineup data into the store
    if (loadLineupFromData) {
      loadLineupFromData(lineup, athletes, boatConfigs, shells);
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6 animate-fade-in sticky top-24">
        <h2 className="text-xl font-bold text-text-primary mb-4">Lineup Manager</h2>

        {/* Lineup Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Lineup Name
          </label>
          <input
            type="text"
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            placeholder="e.g., Practice 2025-10-19"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 text-sm bg-void-elevated text-text-primary placeholder-text-muted transition-all"
          />
        </div>

        {/* Add Boat Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowBoatModal(true)}
            className="w-full px-4 py-3 bg-blade-blue text-white rounded-lg hover:shadow-lg hover:shadow-glow-blue transition-all duration-150 font-medium hover:scale-[1.02] active:scale-[0.98]"
          >
            + Add Boat to Lineup
          </button>
        </div>

        {/* Load Saved Lineups */}
        <div className="mb-6">
          <button
            onClick={() => setShowSavedLineups(true)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:border-white/30 hover:bg-white/5 transition-all duration-200 font-medium"
          >
            Load Saved Lineup
          </button>
        </div>

        {/* Selection Status - Blue IS a signal here (active selection state) */}
        {selectedAthlete && (
          <div className="mb-4 p-3 bg-blade-blue/10 border border-blade-blue/30 rounded-lg backdrop-blur-sm">
            <div className="text-sm font-semibold text-blade-blue mb-1">
              Athlete Selected
            </div>
            <div className="text-sm text-blade-blue/80">
              {selectedAthlete.lastName} {selectedAthlete.firstName}
            </div>
            <button
              onClick={clearAthleteSelection}
              className="mt-2 text-xs text-blade-blue hover:text-blade-blue/80 underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Swap Controls */}
        {selectedSeats.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg backdrop-blur-sm">
            <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-400 mb-1">
              Seats Selected: {selectedSeats.length}/2
            </div>
            <div className="flex gap-2 mt-2">
              {selectedSeats.length === 2 && (
                <button
                  onClick={handleSwap}
                  className="px-3 py-1 bg-yellow-600 dark:bg-yellow-500 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-all text-sm font-medium hover:scale-105 active:scale-95"
                >
                  Swap Athletes
                </button>
              )}
              <button
                onClick={clearSeatSelection}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm hover:scale-105 active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            saveMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Lineup Actions */}
        {activeBoats.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Lineup Actions</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-all text-sm font-medium hover:scale-105 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : (isAuthenticated ? 'Save to Database' : 'Save Locally')}
              </button>
              <button
                onClick={() => setShowPDFExport(true)}
                className="px-3 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all text-sm font-medium hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Export PDF
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-coxswain-violet text-white rounded-lg hover:bg-coxswain-violet/90 transition-all text-sm font-medium hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Export JSON
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Workspace</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>Active boats: {activeBoats.length}</div>
            {!isAuthenticated && (
              <div className="text-xs text-text-muted mt-2">
                Sign in to save lineups to the database
              </div>
            )}
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

      {/* Saved Lineups Modal */}
      <SavedLineupsModal
        isOpen={showSavedLineups}
        onClose={() => setShowSavedLineups(false)}
        onLoad={handleLoadLineup}
      />

      {/* PDF Export Modal */}
      <PDFExportModal
        isOpen={showPDFExport}
        onClose={() => setShowPDFExport(false)}
        lineupName={lineupName}
        boats={activeBoats}
      />
    </>
  );
};

export default AssignmentControls;
