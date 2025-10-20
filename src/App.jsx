import React, { useEffect, useState } from 'react';
import DragDropProvider from './components/Assignment/DragDropContext';
import AthleteBank from './components/AthleteBank/AthleteBank';
import BoatDisplay from './components/BoatDisplay/BoatDisplay';
import CompactBoatView from './components/BoatDisplay/CompactBoatView';
import AssignmentControls from './components/Assignment/AssignmentControls';
import PerformanceModal from './components/PerformanceView/PerformanceModal';
import DarkModeToggle from './components/DarkModeToggle';
import useLineupStore from './store/lineupStore';
import { useDarkMode } from './hooks/useDarkMode';
import { loadAthletes, loadBoats, loadShells, loadErgData } from './utils/csvParser';
import { preloadHeadshots } from './utils/fileLoader';
import './App.css';

/**
 * Main Application Component
 * Handles data loading and layout
 */
function App() {
  const {
    setAthletes,
    setBoatConfigs,
    setShells,
    setErgData,
    setHeadshotMap,
    toggleBoatExpanded,
    activeBoats,
    athletes,
    lineupName
  } = useLineupStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAthleteForPerf, setSelectedAthleteForPerf] = useState(null);
  const [isDark, toggleDarkMode] = useDarkMode();

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load athletes from existing LN_Country.csv (via API endpoint)
        const athletesData = await loadAthletes('/api/data/athletes.csv');
        console.log('Loaded athletes:', athletesData.length);
        setAthletes(athletesData);

        // Load boat configurations
        const boatsData = await loadBoats('/data/boats.csv');
        console.log('Loaded boat configs:', boatsData.length);
        setBoatConfigs(boatsData);

        // Load shell names
        const shellsData = await loadShells('/data/shells.csv');
        console.log('Loaded shells:', shellsData.length);
        setShells(shellsData);

        // Load erg data (template - will be empty or example data)
        const ergData = await loadErgData('/data/erg_data_template.csv');
        console.log('Loaded erg data:', ergData.length);
        setErgData(ergData);

        // Preload headshots
        const headshotMap = await preloadHeadshots(athletesData);
        console.log('Preloaded headshots:', headshotMap.size);
        setHeadshotMap(headshotMap);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🚣</div>
          <div className="text-xl font-semibold text-gray-700">Loading RowLab...</div>
          <div className="text-sm text-gray-500 mt-2">Preparing athlete roster and boat configurations</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DragDropProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg bg-gradient-mesh transition-all duration-300">
        {/* Header */}
        <header className="glass-elevated sticky top-0 z-40 border-b dark:border-white/10">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple bg-clip-text text-transparent">
                  RowLab
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 font-medium">
                  Rowing Lineup Manager
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right text-sm hidden sm:block">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {athletes.length} Athletes
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {activeBoats.length} Active Boats
                  </div>
                </div>
                <DarkModeToggle isDark={isDark} toggle={toggleDarkMode} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar - Controls */}
            <div className="lg:col-span-1">
              <AssignmentControls />
            </div>

            {/* Center - Boat Workspace */}
            <div className="lg:col-span-2">
              {/* Lineup Name Display */}
              {lineupName && (
                <div className="glass-card rounded-2xl p-4 mb-6 border-l-4 border-blue-600 dark:border-accent-blue animate-slide-up">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-accent-blue dark:to-accent-purple bg-clip-text text-transparent">{lineupName}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activeBoats.length} boat{activeBoats.length !== 1 ? 's' : ''}</p>
                </div>
              )}

              <div className="space-y-4">
                {activeBoats.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 animate-fade-in">
                    <div className="text-6xl mb-4">🚣</div>
                    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                      No Boats in Lineup
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Click "+ Add Boat to Lineup" to start building your lineup
                    </p>
                  </div>
                ) : (
                  activeBoats.map(boat => (
                    boat.isExpanded ? (
                      <BoatDisplay key={boat.id} boat={boat} />
                    ) : (
                      <CompactBoatView
                        key={boat.id}
                        boat={boat}
                        onExpand={() => toggleBoatExpanded(boat.id)}
                      />
                    )
                  ))
                )}
              </div>
            </div>

            {/* Right sidebar - Athlete Bank */}
            <div className="lg:col-span-1">
              <AthleteBank />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-elevated border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>RowLab v1.0 - Rowing Lineup Manager</p>
            <p className="mt-1 text-xs">
              Click athletes to select, drag to assign, click seats to swap
            </p>
          </div>
        </footer>

        {/* Performance Modal (if athlete selected for viewing) */}
        {selectedAthleteForPerf && (
          <PerformanceModal
            athlete={selectedAthleteForPerf}
            onClose={() => setSelectedAthleteForPerf(null)}
            ergData={[]} // Will be populated when erg data is available
          />
        )}
      </div>
    </DragDropProvider>
  );
}

export default App;
