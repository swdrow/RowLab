import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_URL = '/api/v1';

/**
 * Concept2CallbackPage
 *
 * Handles OAuth callback from Concept2 Logbook.
 * Exchanges the authorization code for tokens via backend API.
 * Displays status and closes the popup window or redirects.
 */
export default function Concept2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const processingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate processing (React StrictMode runs effects twice)
      if (processingRef.current) {
        return;
      }
      processingRef.current = true;
      const error = searchParams.get('error');
      const c2Connected = searchParams.get('c2_connected');
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // Handle error from Concept2
      if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(error));
        notifyAndClose(false, error);
        return;
      }

      // Handle already-processed success redirect
      if (c2Connected === 'true') {
        setStatus('success');
        notifyAndClose(true);
        return;
      }

      // Handle OAuth code exchange
      if (code && state) {
        try {
          // Exchange code for tokens via backend
          const res = await fetch(`${API_URL}/concept2/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
            method: 'GET',
            credentials: 'include',
          });

          if (res.redirected) {
            // Backend redirected us - check the final URL for success/error
            const finalUrl = new URL(res.url);
            if (finalUrl.searchParams.get('c2_connected') === 'true') {
              setStatus('success');
              notifyAndClose(true);
            } else {
              const errMsg = finalUrl.searchParams.get('error') || 'Connection failed';
              setStatus('error');
              setErrorMessage(errMsg);
              notifyAndClose(false, errMsg);
            }
          } else {
            // Non-redirect response - check content type
            const contentType = res.headers.get('content-type') || '';

            if (res.ok && contentType.includes('text/html')) {
              // Backend returned HTML popup script - this means success
              // The HTML contains postMessage to notify opener
              setStatus('success');
              notifyAndClose(true);
            } else if (contentType.includes('application/json')) {
              // JSON response - parse and check
              const data = await res.json();
              if (data.success) {
                setStatus('success');
                notifyAndClose(true);
              } else {
                setStatus('error');
                setErrorMessage(data.error?.message || 'Connection failed');
                notifyAndClose(false, data.error?.message);
              }
            } else {
              // Unknown content type - try to parse as text for error message
              const text = await res.text();
              if (res.ok) {
                // 200 OK with non-JSON/HTML - assume success
                setStatus('success');
                notifyAndClose(true);
              } else {
                setStatus('error');
                setErrorMessage(text.slice(0, 100) || 'Connection failed');
                notifyAndClose(false, 'Connection failed');
              }
            }
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          setStatus('error');
          setErrorMessage(err.message || 'Failed to complete connection');
          notifyAndClose(false, err.message);
        }
        return;
      }

      // No recognizable params - show error
      setStatus('error');
      setErrorMessage('Invalid callback - missing parameters');
    };

    const notifyAndClose = (success, error = null) => {
      if (window.opener) {
        window.opener.postMessage({
          type: 'concept2-oauth-complete',
          success,
          error
        }, window.location.origin);
        setTimeout(() => window.close(), success ? 1000 : 2000);
      } else {
        setTimeout(() => navigate(success ? '/app/settings' : '/app/settings'), success ? 2000 : 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-void-deep flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 rounded-2xl bg-void-elevated border border-white/5 text-center"
      >
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blade-blue animate-spin" />
            </div>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">
              Processing...
            </h2>
            <p className="text-text-secondary text-sm">
              Completing your Concept2 connection
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)]">
              <CheckCircle className="w-8 h-8 text-blade-blue" />
            </div>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">
              Connected Successfully!
            </h2>
            <p className="text-text-secondary text-sm">
              Your Concept2 Logbook is now connected. {window.opener ? 'This window will close shortly.' : 'Redirecting...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-danger-red/10 border border-danger-red/20 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-danger-red" />
            </div>
            <h2 className="text-xl font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">
              Connection Failed
            </h2>
            <p className="text-text-secondary text-sm">
              {errorMessage || 'An error occurred during connection.'}
            </p>
            <p className="text-text-muted text-xs mt-2">
              {window.opener ? 'This window will close shortly.' : 'Redirecting to settings...'}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
