import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  Bot,
  Settings,
  Zap,
  Box,
  MessageSquare,
  Eye,
  FileText,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { checkAIStatus, setPreferredModel } from '../../services/aiService';
import { handleApiResponse } from '@utils/api';

/**
 * Admin Panel Component
 * For managing user applications, accounts, and AI settings
 */
function AdminPanel({ isOpen, onClose }) {
  const { getAuthHeaders, user } = useAuthStore();
  const {
    aiModel,
    setAIModel,
    features,
    setFeature,
    performance,
    setPerformance,
    enableLowPowerMode,
    disableLowPowerMode,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // AI status
  const [aiStatus, setAiStatus] = useState(null);
  const [checkingAI, setCheckingAI] = useState(false);

  // Check if current user is admin (only users with isAdmin flag can access)
  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (isOpen && isAdmin) {
      if (activeTab === 'ai') {
        checkAI();
      } else {
        fetchData();
      }
    }
  }, [isOpen, activeTab]);

  const checkAI = async () => {
    setCheckingAI(true);
    const status = await checkAIStatus();
    setAiStatus(status);

    // Update local settings store with the persisted model from backend
    if (status?.model) {
      setAIModel(status.model);
    }

    setCheckingAI(false);
  };

  const handleModelChange = async (newModel) => {
    // Update local state immediately
    setAIModel(newModel);

    // Persist to backend
    const result = await setPreferredModel(newModel);
    if (!result.success) {
      setError(`Failed to save model preference: ${result.error}`);
      // Revert on error
      if (aiStatus?.model) {
        setAIModel(aiStatus.model);
      }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'applications') {
        const res = await fetch('/api/v1/auth/applications', {
          headers: getAuthHeaders(),
        });
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Endpoint not implemented yet
          setApplications([]);
          return;
        }
        const data = await handleApiResponse(res, 'Failed to load applications');
        setApplications(data.data?.applications || data.applications || []);
      } else if (activeTab === 'users') {
        const res = await fetch('/api/v1/auth/users', {
          headers: getAuthHeaders(),
        });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setUsers([]);
          return;
        }
        const data = await handleApiResponse(res, 'Failed to load users');
        setUsers(data.data?.users || data.users || []);
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
      const res = await fetch(`/api/v1/auth/applications/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to approve application');
      }
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
      const res = await fetch(`/api/v1/auth/applications/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to reject application');
      }
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
      const res = await fetch(`/api/v1/auth/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete user');
      }
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Ollama is controlled via systemd/Home Assistant, not RowLab
  // This just refreshes the status display
  const refreshOllamaStatus = () => {
    checkAI();
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass-card rounded-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Access Denied
            </h2>
            <p className="text-text-secondary mb-6">
              Only administrators can access this panel.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-void-surface hover:bg-void-elevated text-text-primary font-semibold rounded-xl transition-all"
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

  const renderAISettings = () => (
    <div className="space-y-6">
      {/* Ollama Status Display */}
      <div className={`p-4 rounded-xl border ${aiStatus?.available
        ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30'
        : 'bg-void-surface border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${aiStatus?.available ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white/20'}`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Ollama AI Model
              </h3>
              <p className="text-sm text-text-muted">
                {aiStatus?.available
                  ? 'Running - using system resources'
                  : 'Stopped - control via Home Assistant'
                }
              </p>
            </div>
          </div>
          <button
            onClick={refreshOllamaStatus}
            disabled={checkingAI}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-5 h-5 text-text-muted ${checkingAI ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2">
          {checkingAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              <span className="text-sm text-text-muted">Checking status...</span>
            </>
          ) : aiStatus?.available ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600 dark:text-green-400">Connected to Ollama</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-sm text-text-muted">Ollama is not running</span>
            </>
          )}
        </div>

        {/* Home Assistant control info */}
        {!aiStatus?.available && (
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-text-secondary">
              <strong className="text-text-primary">Control via Home Assistant:</strong> Use the Ollama switch in your HA dashboard to start/stop the AI service and save system resources.
            </p>
          </div>
        )}
      </div>

      {/* Connection Status - Only show when Ollama is running */}
      {aiStatus?.available && (
        <div className="p-4 bg-void-elevated/50 rounded-xl border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">
              Ollama Connection
            </h3>
            <button
              onClick={checkAI}
              disabled={checkingAI}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-text-muted ${checkingAI ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {checkingAI ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking connection...</span>
            </div>
          ) : aiStatus?.available ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Wifi className="w-5 h-5" />
                <span className="font-medium">Connected to Ollama</span>
              </div>
              <div className="text-sm text-text-muted">
                Endpoint: {aiStatus.endpoint}
              </div>
              {aiStatus.models?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Active Model
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-void-surface border border-white/[0.08] text-text-primary"
                  >
                    {aiStatus.models.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-muted mt-1">
                    Selection is saved for your team
                  </p>
                </div>
              )}
            </div>
          ) : aiStatus?.disabled ? (
            <div className="flex items-center gap-2 text-text-muted">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">AI Disabled by Server</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">Ollama Not Running</span>
              </div>
              <p className="text-sm text-text-muted">
                {aiStatus?.error || 'Start Ollama to enable AI features'}
              </p>
              <div className="p-3 bg-void-surface/50 rounded-lg">
                <p className="text-xs font-mono text-text-secondary">
                  # Install Ollama<br />
                  curl -fsSL https://ollama.ai/install.sh | sh<br /><br />
                  # Pull a model<br />
                  ollama pull phi3:mini<br /><br />
                  # Start serving<br />
                  ollama serve
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
              About the AI Assistant
            </h4>
            <p className="text-sm text-purple-600 dark:text-purple-300">
              The AI assistant uses a local Ollama model to help with lineup suggestions.
              It runs entirely on your machine - no data is sent to external servers.
              Toggle it off during demos to save resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Feature toggle component
  const FeatureToggle = ({ name, label, description, icon: Icon, category }) => (
    <div className="flex items-center justify-between p-3 bg-void-elevated/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          features[name] ? 'bg-green-500/20 text-green-600' : 'bg-white/[0.08] text-text-muted'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-text-primary text-sm">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => setFeature(name, !features[name])}
        disabled={performance.lowPowerMode && ['aiAssistant', 'aiSuggestions', 'collaboration', 'presenceTracking', 'liveCursors', 'waterSimulation', 'highResPDF'].includes(name)}
        className={`relative w-14 h-6 rounded-full transition-colors ${
          features[name] ? 'bg-green-500' : 'bg-white/20'
        } ${performance.lowPowerMode ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
          animate={{ left: features[name] ? '1.875rem' : '0.125rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );

  const renderFeaturesSettings = () => (
    <div className="space-y-6">
      {/* Low Power Mode - Master Toggle */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              performance.lowPowerMode
                ? 'bg-amber-500 text-white'
                : 'bg-void-surface text-text-muted'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Low Power Mode
              </h3>
              <p className="text-sm text-text-muted">
                Disables all heavy features to reduce server/client load
              </p>
            </div>
          </div>
          <button
            onClick={() => performance.lowPowerMode ? disableLowPowerMode() : enableLowPowerMode()}
            className={`relative w-18 h-7 rounded-full transition-colors ${
              performance.lowPowerMode ? 'bg-amber-500' : 'bg-white/20'
            }`}
          >
            <motion.div
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
              animate={{ left: performance.lowPowerMode ? '2.75rem' : '0.25rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
        {performance.lowPowerMode && (
          <div className="mt-3 flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Heavy features are disabled. Toggle off to re-enable them.</span>
          </div>
        )}
      </div>

      {/* AI Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-1">
          AI Features (High Overhead)
        </h3>
        <div className="space-y-2 p-3 bg-void-elevated/50 rounded-xl border border-white/[0.06]">
          <FeatureToggle
            name="aiAssistant"
            label="AI Chat Assistant"
            description="Ollama-powered coaching assistant"
            icon={MessageSquare}
          />
          <FeatureToggle
            name="aiSuggestions"
            label="AI Lineup Suggestions"
            description="Auto-generate lineup recommendations"
            icon={Sparkles}
          />
        </div>
      </div>

      {/* Real-time Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-1">
          Real-time Features (Moderate Overhead)
        </h3>
        <div className="space-y-2 p-3 bg-void-elevated/50 rounded-xl border border-white/[0.06]">
          <FeatureToggle
            name="collaboration"
            label="Real-time Collaboration"
            description="WebSocket sync for live editing"
            icon={Users}
          />
          <FeatureToggle
            name="presenceTracking"
            label="Presence Tracking"
            description="Show who's currently online"
            icon={Eye}
          />
          <FeatureToggle
            name="liveCursors"
            label="Live Cursors"
            description="Show other users' cursor positions"
            icon={Activity}
          />
        </div>
      </div>

      {/* 3D Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-1">
          3D Visualization (Client Overhead)
        </h3>
        <div className="space-y-2 p-3 bg-void-elevated/50 rounded-xl border border-white/[0.06]">
          <FeatureToggle
            name="threeDViewer"
            label="3D Boat Viewer"
            description="Three.js boat visualization"
            icon={Box}
          />
          <FeatureToggle
            name="threeDAnimations"
            label="3D Animations"
            description="Animated oars and movement"
            icon={Activity}
          />
          <FeatureToggle
            name="waterSimulation"
            label="Water Simulation"
            description="Animated water surface (heavy)"
            icon={Activity}
          />
        </div>
      </div>

      {/* Export Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-1">
          Export Features
        </h3>
        <div className="space-y-2 p-3 bg-void-elevated/50 rounded-xl border border-white/[0.06]">
          <FeatureToggle
            name="pdfExport"
            label="PDF Export"
            description="Export lineups as PDF documents"
            icon={FileText}
          />
          <FeatureToggle
            name="highResPDF"
            label="High Resolution PDF"
            description="Better quality, more memory usage"
            icon={FileText}
          />
        </div>
      </div>

      {/* Performance Settings */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider px-1">
          Performance Settings
        </h3>
        <div className="p-4 bg-void-elevated/50 rounded-xl border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-sm">Reduced Motion</p>
              <p className="text-xs text-text-muted">Disable animations</p>
            </div>
            <button
              onClick={() => setPerformance('reducedMotion', !performance.reducedMotion)}
              className={`relative w-14 h-6 rounded-full transition-colors ${
                performance.reducedMotion ? 'bg-blade-blue' : 'bg-white/20 dark:bg-white/20'
              }`}
            >
              <motion.div
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: performance.reducedMotion ? '1.875rem' : '0.125rem' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-text-primary text-sm">Max Active Boats</p>
                <p className="text-xs text-text-muted">Limit concurrent boats in workspace</p>
              </div>
              <span className="text-sm font-mono text-text-secondary">
                {performance.maxActiveBoats}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={performance.maxActiveBoats}
              onChange={(e) => setPerformance('maxActiveBoats', parseInt(e.target.value))}
              className="w-full h-2 bg-void-surface rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass-card rounded-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-text-muted" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            Admin Panel
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'bg-blade-blue text-white'
                : 'bg-void-surface text-text-primary hover:bg-white/[0.08]'
            }`}
          >
            <Users className="w-4 h-4" />
            Applications
            {applications.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {applications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-blade-blue text-white'
                : 'bg-void-surface text-text-primary hover:bg-white/[0.08]'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-blade-blue text-white'
                : 'bg-void-surface text-text-primary hover:bg-white/[0.08]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'features'
                ? 'bg-blade-blue text-white'
                : 'bg-void-surface text-text-primary hover:bg-white/[0.08]'
            }`}
          >
            <Settings className="w-4 h-4" />
            Features
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'features' ? (
            renderFeaturesSettings()
          ) : activeTab === 'ai' ? (
            renderAISettings()
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blade-blue" />
            </div>
          ) : activeTab === 'applications' ? (
            applications.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-void-elevated/50 rounded-xl border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-text-primary">
                            {app.name}
                          </span>
                          <span className="text-text-muted text-sm">
                            @{app.username}
                          </span>
                        </div>
                        {app.email && (
                          <p className="text-sm text-text-secondary">
                            {app.email}
                          </p>
                        )}
                        {app.requestMessage && (
                          <p className="text-sm text-text-secondary mt-2 italic">
                            "{app.requestMessage}"
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">
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
              <div className="text-center py-12 text-text-muted">
                <Users className="w-12 h-12 mx-auto mb-3" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-void-elevated/50 rounded-xl border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-text-primary">
                            {u.name}
                          </span>
                          <span className="text-text-muted text-sm">
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
                          <p className="text-sm text-text-secondary">
                            {u.email}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-1">
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
      </motion.div>
    </div>
  );
}

export default AdminPanel;
