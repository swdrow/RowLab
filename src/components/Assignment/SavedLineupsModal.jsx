import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { handleApiResponse } from '@utils/api';

/**
 * Modal for viewing and loading saved lineups
 */
function SavedLineupsModal({ isOpen, onClose, onLoad }) {
  const { isAuthenticated, getAuthHeaders } = useAuthStore();
  const [lineups, setLineups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchLineups();
    }
  }, [isOpen]);

  const fetchLineups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        // Fetch from database
        const res = await fetch('/api/v1/lineups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const data = await handleApiResponse(res, 'Failed to load lineups');
        setLineups(data.data?.lineups || data.lineups || []);
      } else {
        // Fetch from localStorage
        const saved = JSON.parse(localStorage.getItem('rowlab_lineups') || '{}');
        const localLineups = Object.entries(saved).map(([name, data]) => ({
          id: name,
          name,
          ...data,
          isLocal: true,
        }));
        setLineups(localLineups);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (lineup) => {
    try {
      if (lineup.isLocal) {
        // Delete from localStorage
        const saved = JSON.parse(localStorage.getItem('rowlab_lineups') || '{}');
        delete saved[lineup.name];
        localStorage.setItem('rowlab_lineups', JSON.stringify(saved));
      } else {
        // Delete from database
        const res = await fetch(`/api/v1/lineups/${lineup.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      }
      setDeleteConfirm(null);
      fetchLineups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoad = (lineup) => {
    onLoad(lineup);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-2xl mx-4 animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-2xl font-bold text-text-primary">
            Saved Lineups
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isAuthenticated ? 'Your saved lineups from the database' : 'Lineups saved in your browser'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-red/10 text-danger-red rounded-lg text-sm border border-danger-red/20">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blade-blue" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : lineups.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <div className="text-5xl mb-3">📭</div>
              <p>No saved lineups yet</p>
              <p className="text-sm mt-2">
                {isAuthenticated
                  ? 'Create a lineup and click Save to store it'
                  : 'Sign in to save lineups to the database'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lineups.map((lineup) => (
                <div
                  key={lineup.id}
                  className="p-4 bg-void-elevated/50 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">
                          {lineup.name}
                        </span>
                        {lineup.isLocal && (
                          <span className="px-2 py-0.5 bg-white/10 text-text-muted text-xs rounded-full">
                            Local
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        {lineup.boats?.length || lineup.assignments?.length || 0} boat(s)
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(lineup.createdAt || lineup.timestamp)}
                      </p>
                      {lineup.notes && (
                        <p className="text-sm text-text-muted mt-2 italic">
                          "{lineup.notes}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleLoad(lineup)}
                        className="px-3 py-1.5 bg-blade-blue hover:bg-blade-blue/90 text-void-deep text-sm font-medium rounded-lg transition-all"
                      >
                        Load
                      </button>
                      {deleteConfirm === lineup.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(lineup)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-all border border-white/10"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(lineup.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-text-secondary">
            Sign in to save lineups to the database and access them from anywhere.
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedLineupsModal;
