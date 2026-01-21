import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Ship,
  Timer,
  Flag,
} from 'lucide-react';
import RegattaList from '../components/Racing/RegattaList';
import RaceResultsEntry from '../components/Racing/RaceResultsEntry';
import TeamRankingsDisplay from '../components/Racing/TeamRankingsDisplay';
import { RaceDayView } from '../components/Racing/RaceDay';
import useRegattaStore from '../store/regattaStore';
import SpotlightCard from '../components/ui/SpotlightCard';

// Import extracted components and config
import { TABS, tabColorConfig, getDefaultRegattaForm, getDefaultRaceForm } from './racing-config';
import { Button } from './RacingFormComponents';
import { CreateRegattaModal, AddRaceModal } from './RacingModals';

/**
 * RacingPage - Main page for racing management
 * Redesigned with Precision Instrument design system
 */
function RacingPage() {
  const { createRegatta, addRace, fetchRegatta, currentRegatta, loading } = useRegattaStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('regattas');

  // Selection state
  const [selectedRegatta, setSelectedRegatta] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddRaceModal, setShowAddRaceModal] = useState(false);

  // Form state for new regatta
  const [newRegatta, setNewRegatta] = useState(getDefaultRegattaForm);
  const [regattaFormError, setRegattaFormError] = useState(null);

  // Form state for new race
  const [newRace, setNewRace] = useState(getDefaultRaceForm);
  const [raceFormError, setRaceFormError] = useState(null);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle regatta selection
  const handleSelectRegatta = async (regatta) => {
    setSelectedRegatta(regatta);
    try {
      await fetchRegatta(regatta.id);
    } catch (err) {
      // Revert selection on failure
      setSelectedRegatta(null);
    }
  };

  // Handle back to regatta list
  const handleBackToList = () => {
    setSelectedRegatta(null);
    setSelectedRace(null);
  };

  // Handle create regatta modal open
  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Handle create regatta modal close
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewRegatta(getDefaultRegattaForm());
    setRegattaFormError(null);
  };

  // Handle create regatta form submission
  const handleCreateRegatta = async (e) => {
    e.preventDefault();

    if (!newRegatta.name.trim()) {
      setRegattaFormError('Name is required');
      return;
    }
    if (!newRegatta.date) {
      setRegattaFormError('Date is required');
      return;
    }

    try {
      setRegattaFormError(null);
      const regatta = await createRegatta(newRegatta);
      handleCloseCreateModal();
      setSelectedRegatta(regatta);
      await fetchRegatta(regatta.id);
    } catch (error) {
      setRegattaFormError(error.message || 'Failed to create regatta');
    }
  };

  // Handle regatta form input change
  const handleRegattaInputChange = (e) => {
    const { name, value } = e.target;
    setNewRegatta((prev) => ({ ...prev, [name]: value }));
    if (regattaFormError) setRegattaFormError(null);
  };

  // Handle add race modal open
  const handleOpenAddRaceModal = () => {
    setShowAddRaceModal(true);
  };

  // Handle add race modal close
  const handleCloseAddRaceModal = () => {
    setShowAddRaceModal(false);
    setNewRace(getDefaultRaceForm());
    setRaceFormError(null);
  };

  // Handle add race form submission
  const handleAddRace = async (e) => {
    e.preventDefault();

    if (!newRace.eventName.trim()) {
      setRaceFormError('Event name is required');
      return;
    }
    if (!newRace.boatClass) {
      setRaceFormError('Boat class is required');
      return;
    }
    if (!newRace.distanceMeters || newRace.distanceMeters <= 0) {
      setRaceFormError('Distance must be greater than 0');
      return;
    }

    try {
      setRaceFormError(null);
      await addRace(selectedRegatta.id, newRace);
      handleCloseAddRaceModal();
    } catch (error) {
      setRaceFormError(error.message || 'Failed to add race');
    }
  };

  // Handle race form input change
  const handleRaceInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      // Preserve empty string for form editing, validate on submit
      if (value === '') {
        processedValue = '';
      } else {
        const parsed = parseInt(value, 10);
        processedValue = Number.isNaN(parsed) ? '' : parsed;
      }
    } else {
      processedValue = value;
    }

    setNewRace((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    if (raceFormError) setRaceFormError(null);
  };

  // Handle race selection for results entry
  const handleSelectRace = (race) => {
    setSelectedRace(race);
  };

  // Handle close race results entry
  const handleCloseRaceResults = () => {
    setSelectedRace(null);
    if (selectedRegatta) {
      fetchRegatta(selectedRegatta.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
      className="min-h-screen bg-void-deep"
    >
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blade-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-warning-orange/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05, ease: [0, 0, 0.2, 1] }}
          className="border-b border-white/[0.06] bg-void-surface/50 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.15)]">
                <Flag className="w-6 h-6 text-blade-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-text-primary tracking-[-0.02em]">
                  Racing
                </h1>
                <p className="text-sm text-text-secondary mt-0.5">
                  Track regattas, results, and team rankings
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex gap-2 pb-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const colorStyles = tabColorConfig[tab.color];

                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'regattas') {
                        setSelectedRegatta(null);
                        setSelectedRace(null);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out border ${
                      isActive ? colorStyles.active : `${colorStyles.inactive} border-transparent`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'regattas' ? (
              <motion.div
                key="regattas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
              >
                {selectedRace ? (
                  // Race Results Entry
                  <RaceResultsEntry
                    regatta={currentRegatta}
                    race={selectedRace}
                    onClose={handleCloseRaceResults}
                  />
                ) : selectedRegatta && currentRegatta ? (
                  // Regatta Detail View
                  <div className="space-y-6">
                    {/* Regatta Header */}
                    <SpotlightCard className="p-6" spotlightColor="rgba(0, 112, 243, 0.08)">
                      <div className="flex items-start justify-between">
                        <div>
                          <button
                            onClick={handleBackToList}
                            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4 group"
                          >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to Regattas
                          </button>
                          <h2 className="text-xl font-semibold text-text-primary mb-3">
                            {currentRegatta.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                              <Calendar className="w-4 h-4" />
                              {formatDate(currentRegatta.date)}
                            </span>
                            {currentRegatta.location && (
                              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                                <MapPin className="w-4 h-4" />
                                {currentRegatta.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab('raceday')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-success-green/10 text-success-green border border-success-green/30 hover:bg-success-green/20 transition-all"
                          >
                            <Flag className="w-4 h-4" />
                            Race Day Mode
                          </button>
                          <Button variant="primary" onClick={handleOpenAddRaceModal}>
                            <Plus className="w-4 h-4" />
                            Add Race
                          </Button>
                        </div>
                      </div>
                    </SpotlightCard>

                    {/* Races List */}
                    {currentRegatta.races?.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16"
                      >
                        <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
                          <Ship className="w-8 h-8 text-text-muted" />
                        </div>
                        <p className="text-text-primary font-medium mb-2">No races yet</p>
                        <p className="text-text-secondary text-sm text-center max-w-sm">
                          Add races to this regatta to start entering results.
                        </p>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentRegatta.races?.map((race, index) => (
                          <motion.div
                            key={race.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                          >
                            <SpotlightCard
                              className="p-4 cursor-pointer group"
                              spotlightColor="rgba(0, 112, 243, 0.06)"
                            >
                              <div
                                onClick={() => handleSelectRace(race)}
                                className="h-full"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <span className="font-medium text-text-primary group-hover:text-blade-blue transition-colors">
                                    {race.eventName}
                                  </span>
                                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-blade-blue group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="px-2.5 py-1 bg-blade-blue/10 text-blade-blue text-xs font-medium rounded-full border border-blade-blue/20">
                                    {race.boatClass}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-text-muted">
                                    <Timer className="w-3 h-3" />
                                    {race.distanceMeters}m
                                  </span>
                                  {race.isHeadRace && (
                                    <span className="px-2.5 py-1 bg-coxswain-violet/10 text-coxswain-violet text-xs font-medium rounded-full border border-coxswain-violet/20">
                                      Head Race
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-muted">
                                  {race.results?.length || 0} result
                                  {(race.results?.length || 0) !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </SpotlightCard>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regatta List
                  <RegattaList
                    onSelectRegatta={handleSelectRegatta}
                    onCreateNew={handleCreateNew}
                  />
                )}
              </motion.div>
            ) : activeTab === 'raceday' ? (
              // Race Day Tab
              <motion.div
                key="raceday"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
              >
                <RaceDayView
                  regatta={currentRegatta}
                  onBack={() => {
                    setSelectedRegatta(null);
                    setActiveTab('regattas');
                  }}
                  onSelectRace={handleSelectRace}
                  onRefresh={() => selectedRegatta && fetchRegatta(selectedRegatta.id)}
                  loading={loading}
                />
              </motion.div>
            ) : (
              // Rankings Tab
              <motion.div
                key="rankings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
              >
                <TeamRankingsDisplay />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Regatta Modal */}
      <CreateRegattaModal
        show={showCreateModal}
        onClose={handleCloseCreateModal}
        formData={newRegatta}
        onInputChange={handleRegattaInputChange}
        onSubmit={handleCreateRegatta}
        error={regattaFormError}
        loading={loading}
      />

      {/* Add Race Modal */}
      <AddRaceModal
        show={showAddRaceModal}
        onClose={handleCloseAddRaceModal}
        formData={newRace}
        onInputChange={handleRaceInputChange}
        onSubmit={handleAddRace}
        error={raceFormError}
        loading={loading}
      />
    </motion.div>
  );
}

export default RacingPage;
