/**
 * @deprecated V1 Legacy — replaced by V2/V3 erg data components.
 * See: src/v2/pages/ErgTestsPage.tsx, src/v2/components/erg/
 * Removal planned: Phase 36 (V1/V2 Cleanup)
 */
import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import AddErgTestModal from './AddErgTestModal';
import { handleApiResponse } from '@utils/api';

/**
 * Modal for viewing and managing athlete erg test history
 */
function ErgDataModal({ athlete, isOpen, onClose }) {
  const { isAuthenticated, getAuthHeaders } = useAuthStore();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddTest, setShowAddTest] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isOpen && athlete) {
      fetchTests();
    }
  }, [isOpen, athlete]);

  const fetchTests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/erg-tests?athleteId=${athlete.id}`);
      const data = await handleApiResponse(res, 'Failed to fetch erg tests');
      setTests(data.tests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this erg test?')) return;

    try {
      const res = await fetch(`/api/erg-tests/${testId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchTests();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const testTypes = [...new Set(tests.map((t) => t.testType))];
  const filteredTests =
    filterType === 'all' ? tests : tests.filter((t) => t.testType === filterType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-2xl mx-4 animate-slide-up max-h-[85vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            Erg Data: {athlete?.firstName} {athlete?.lastName}
          </h2>
          <p className="text-sm text-text-secondary mt-1">Performance history and test results</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-void-elevated text-text-primary text-sm"
            >
              <option value="all">All Tests</option>
              {testTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setShowAddTest(true)}
              className="px-4 py-2 bg-blade-blue hover:bg-blade-blue/90 text-void-deep text-sm font-medium rounded-lg transition-all"
            >
              + Add Test
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-red/10 text-danger-red rounded-lg text-sm border border-danger-red/20">
            {error}
          </div>
        )}

        {/* Tests List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blade-blue" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <div className="text-5xl mb-3">📊</div>
              <p>No erg tests recorded</p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowAddTest(true)}
                  className="mt-4 text-blade-blue hover:underline"
                >
                  Add first test
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="p-4 bg-void-elevated/50 rounded-xl border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-white/10 text-text-primary text-sm font-medium rounded border border-white/10">
                          {test.testType}
                        </span>
                        <span className="text-2xl font-bold text-text-primary">{test.result}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-text-secondary">
                        <div>
                          <span className="text-text-muted">Date:</span> {formatDate(test.testDate)}
                        </div>
                        {test.split && (
                          <div>
                            <span className="text-text-muted">Split:</span> {test.split}
                          </div>
                        )}
                        {test.strokeRate && (
                          <div>
                            <span className="text-text-muted">Rate:</span> {test.strokeRate} spm
                          </div>
                        )}
                        {test.watts && (
                          <div>
                            <span className="text-text-muted">Watts:</span> {test.watts}W
                          </div>
                        )}
                      </div>
                      {test.notes && (
                        <p className="text-sm text-text-muted mt-2 italic">{test.notes}</p>
                      )}
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="ml-4 p-2 text-danger-red hover:text-danger-red/80 transition-colors"
                        title="Delete test"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {filteredTests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-sm text-text-secondary">
              <span className="font-medium">{filteredTests.length}</span> test
              {filteredTests.length !== 1 ? 's' : ''} recorded
              {filterType !== 'all' && ` (${filterType})`}
            </div>
          </div>
        )}
      </div>

      {/* Add Test Modal */}
      <AddErgTestModal
        athlete={athlete}
        isOpen={showAddTest}
        onClose={() => setShowAddTest(false)}
        onSuccess={() => {
          setShowAddTest(false);
          fetchTests();
        }}
      />
    </div>
  );
}

export default ErgDataModal;
