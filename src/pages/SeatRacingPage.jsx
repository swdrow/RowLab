import { useState } from 'react';
import SeatRaceSessionList from '../components/SeatRacing/SeatRaceSessionList';
import SeatRaceEntryForm from '../components/SeatRacing/SeatRaceEntryForm';
import RankingsDisplay from '../components/SeatRacing/RankingsDisplay';
import useSeatRaceStore from '../store/seatRaceStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

/**
 * SeatRacingPage - Main page for seat racing management
 *
 * Features:
 * - Tab navigation between Sessions and Rankings
 * - Session list and detail views
 * - Create new session modal
 * - Rankings display with recalculation
 */
function SeatRacingPage() {
  const { createSession, loading } = useSeatRaceStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('sessions');

  // Session state
  const [selectedSession, setSelectedSession] = useState(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    boatClass: '8+',
    conditions: 'calm',
  });
  const [formError, setFormError] = useState(null);

  // Tab button styling
  const getTabClassName = (tab) => {
    const isActive = activeTab === tab;
    return `px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? 'text-accent border-accent'
        : 'text-text-secondary border-transparent hover:text-text-primary hover:border-surface-600'
    }`;
  };

  // Handle session selection
  const handleSelectSession = (session) => {
    setSelectedSession(session);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedSession(null);
  };

  // Handle create new session button
  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: '',
      boatClass: '8+',
      conditions: 'calm',
    });
    setFormError(null);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formError) {
      setFormError(null);
    }
  };

  // Handle form submission
  const handleSubmitSession = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.date) {
      setFormError('Date is required');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Location is required');
      return;
    }
    if (!formData.boatClass) {
      setFormError('Boat class is required');
      return;
    }
    if (!formData.conditions) {
      setFormError('Conditions are required');
      return;
    }

    try {
      setFormError(null);
      const session = await createSession(formData);
      handleCloseModal();
      // Select the newly created session
      setSelectedSession(session);
    } catch (error) {
      setFormError(error.message || 'Failed to create session');
    }
  };

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <div className="bg-surface-800 border-b border-surface-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Seat Racing</h1>
          <p className="text-text-secondary">
            Manage seat race sessions and view athlete rankings
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-surface-700">
            <button
              onClick={() => setActiveTab('sessions')}
              className={getTabClassName('sessions')}
            >
              <svg
                className="inline-block w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={getTabClassName('rankings')}
            >
              <svg
                className="inline-block w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Rankings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'sessions' && (
          <>
            {selectedSession ? (
              <SeatRaceEntryForm
                session={selectedSession}
                onClose={handleBackToList}
              />
            ) : (
              <SeatRaceSessionList
                onSelectSession={handleSelectSession}
                onCreateNew={handleCreateNew}
              />
            )}
          </>
        )}

        {activeTab === 'rankings' && <RankingsDisplay />}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="bg-surface-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-surface-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
              <h2 className="text-xl font-semibold text-text-primary">
                Create Seat Race Session
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSession} className="px-6 py-4">
              {/* Error Display */}
              {formError && (
                <div className="mb-4 p-3 bg-spectrum-red/10 border border-spectrum-red/30 rounded-lg">
                  <p className="text-spectrum-red text-sm">{formError}</p>
                </div>
              )}

              {/* Date Input */}
              <div className="mb-4">
                <Input
                  label="Date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              {/* Location Input */}
              <div className="mb-4">
                <Input
                  label="Location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Lake Carnegie, Princeton"
                  required
                  className="w-full"
                />
              </div>

              {/* Boat Class Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Boat Class
                </label>
                <select
                  name="boatClass"
                  value={formData.boatClass}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-surface-850 border border-surface-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                >
                  <option value="8+">8+</option>
                  <option value="4+">4+</option>
                  <option value="4-">4-</option>
                  <option value="4x">4x</option>
                  <option value="2-">2-</option>
                  <option value="2x">2x</option>
                </select>
              </div>

              {/* Conditions Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Conditions
                </label>
                <select
                  name="conditions"
                  value={formData.conditions}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-surface-850 border border-surface-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                >
                  <option value="calm">Calm</option>
                  <option value="variable">Variable</option>
                  <option value="rough">Rough</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={loading}
                >
                  Create Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatRacingPage;
