import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Unlink,
  Clock,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  getAuthUrl,
  getConnectionStatus,
  syncWorkouts,
  disconnect,
  openOAuthPopup
} from '../../services/concept2Service';

/**
 * Concept2Connection Component
 *
 * Displays Concept2 Logbook connection status and provides controls for:
 * - Connecting via OAuth
 * - Syncing workouts
 * - Disconnecting
 *
 * Part of the Precision Instrument design system.
 *
 * @param {Object} props
 * @param {string} props.athleteId - Athlete UUID
 * @param {Function} props.onSyncComplete - Callback after successful sync
 * @param {string} props.className - Additional CSS classes
 */
export default function Concept2Connection({ athleteId, onSyncComplete, className = '' }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  // Load connection status
  useEffect(() => {
    loadStatus();
  }, [athleteId]);

  // Listen for OAuth callback completion
  useEffect(() => {
    const handleMessage = (event) => {
      // Validate origin to prevent XSS attacks from untrusted sources
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'concept2-oauth-complete') {
        setConnecting(false);
        if (event.data.success) {
          loadStatus();
        } else {
          setError(event.data.error || 'Connection failed');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConnectionStatus(athleteId);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await getAuthUrl(athleteId);
      const popup = openOAuthPopup(url);

      // Poll to detect popup close
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setConnecting(false);
          loadStatus();
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await syncWorkouts(athleteId);
      setSyncResult(result);
      await loadStatus();
      onSyncComplete?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Concept2? This will not delete existing workout data.')) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    try {
      await disconnect(athleteId);
      setStatus({ connected: false });
      setSyncResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`p-5 rounded-xl bg-void-elevated/50 border border-white/[0.06] ${className}`}>
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading connection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-void-elevated/50 border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl border flex items-center justify-center
              ${status?.connected
                ? 'bg-blade-blue/10 border-blade-blue/20 shadow-[0_0_15px_rgba(0,112,243,0.15)]'
                : 'bg-void-elevated border-white/[0.06]'
              }
            `}>
              {status?.connected ? (
                <CheckCircle className="w-5 h-5 text-blade-blue" />
              ) : (
                <Link2 className="w-5 h-5 text-text-muted" />
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-text-primary tracking-[-0.02em] flex items-center gap-2">
                Concept2 Logbook
                {status?.connected && (
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blade-blue/15 text-blade-blue border border-blade-blue/30">
                    Connected
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {status?.connected
                  ? 'Sync workouts from Concept2 Logbook'
                  : 'Connect to automatically import erg data'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync result */}
        <AnimatePresence>
          {syncResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Sync Complete</span>
              </div>
              <div className="text-xs text-text-muted ml-6">
                {syncResult.imported} imported, {syncResult.skipped} skipped ({syncResult.totalFetched} total)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status?.connected ? (
          <>
            {/* Connection info */}
            <div className="mb-4 p-3 rounded-xl bg-void-deep/50 border border-white/[0.04]">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Last Synced:</span>
              </div>
              <div className="text-sm text-text-primary font-mono ml-5">
                {formatDate(status.lastSyncedAt)}
              </div>
              {status.c2UserId && (
                <div className="text-[10px] text-text-muted mt-2 ml-5">
                  User ID: {status.c2UserId}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
                  bg-blade-blue text-void-deep border border-blade-blue
                  hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  flex items-center justify-center gap-2
                `}
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Sync Workouts
                  </>
                )}
              </button>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className={`
                  px-4 py-2.5 rounded-xl font-medium text-sm
                  bg-void-elevated/50 border border-white/[0.06]
                  text-danger-red
                  hover:bg-danger-red/10 hover:border-danger-red/20
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2
                `}
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Learn more link - uses production URL as this is just an informational link */}
            <a
              href="https://log.concept2.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-blade-blue transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Visit Concept2 Logbook
            </a>
          </>
        ) : (
          <>
            {/* Not connected state */}
            <div className="mb-4 p-4 rounded-xl bg-void-deep/50 border border-white/[0.04] text-center">
              <Download className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary mb-1">
                Connect your Concept2 Logbook to automatically import erg workouts
              </p>
              <p className="text-xs text-text-muted">
                Data syncs from your Concept2 account
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className={`
                w-full px-4 py-2.5 rounded-xl font-medium text-sm
                bg-blade-blue text-void-deep border border-blade-blue
                hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                flex items-center justify-center gap-2
              `}
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Connect Concept2 Logbook
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
