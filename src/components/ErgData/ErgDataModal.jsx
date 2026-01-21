import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import AddErgTestModal from './AddErgTestModal';

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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

  const testTypes = [...new Set(tests.map(t => t.testType))];
  const filteredTests = filterType === 'all'
    ? tests
    : tests.filter(t => t.testType === filterType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-2xl mx-4 animate-slide-up max-h-[85vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Erg Data: {athlete?.firstName} {athlete?.lastName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Performance history and test results
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
            >
              <option value="all">All Tests</option>
              {testTypes.map(type => (
                <option key={type} value={type}>{type}</option>
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
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tests List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blade-blue" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
                  className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-white/10 text-text-primary text-sm font-medium rounded border border-white/10">
                          {test.testType}
                        </span>
                        <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {test.result}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Date:</span>{' '}
                          {formatDate(test.testDate)}
                        </div>
                        {test.split && (
                          <div>
                            <span className="text-gray-400 dark:text-gray-500">Split:</span>{' '}
                            {test.split}
                          </div>
                        )}
                        {test.strokeRate && (
                          <div>
                            <span className="text-gray-400 dark:text-gray-500">Rate:</span>{' '}
                            {test.strokeRate} spm
                          </div>
                        )}
                        {test.watts && (
                          <div>
                            <span className="text-gray-400 dark:text-gray-500">Watts:</span>{' '}
                            {test.watts}W
                          </div>
                        )}
                      </div>
                      {test.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                          {test.notes}
                        </p>
                      )}
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="ml-4 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete test"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{filteredTests.length}</span> test{filteredTests.length !== 1 ? 's' : ''} recorded
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
