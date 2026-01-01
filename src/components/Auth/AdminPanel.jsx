import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

/**
 * Admin Panel Component
 * For managing user applications and accounts
 */
function AdminPanel({ isOpen, onClose }) {
  const { getAuthHeaders, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchData();
    }
  }, [isOpen, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'applications') {
        const res = await fetch('/api/auth/applications', {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setApplications(data.applications || []);
      } else {
        const res = await fetch('/api/auth/users', {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsers(data.users || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/auth/applications/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh applications
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/auth/applications/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh applications
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh users
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-2xl p-8 w-full max-w-md mx-4 animate-slide-up">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Only administrators can access this panel.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-3xl mx-4 animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Admin Panel
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending Applications
            {applications.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {applications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Users
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p>No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {app.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            @{app.username}
                          </span>
                        </div>
                        {app.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {app.email}
                          </p>
                        )}
                        {app.requestMessage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                            "{app.requestMessage}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Applied: {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={actionLoading === app.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === app.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading === app.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === app.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            users.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-5xl mb-3">👥</div>
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {u.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            @{u.username}
                          </span>
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded-full font-medium">
                              admin
                            </span>
                          )}
                          {getStatusBadge(u.status)}
                        </div>
                        {u.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {u.email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Joined: {formatDate(u.createdAt)}
                        </p>
                      </div>
                      {u.id !== user.id && u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                        >
                          {actionLoading === u.id ? '...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
