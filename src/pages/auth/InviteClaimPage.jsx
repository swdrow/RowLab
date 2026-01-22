import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, AlertCircle, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SpotlightCard from '../../components/ui/SpotlightCard';
import { handleApiResponse } from '@utils/api';

const API_URL = '/api/v1';

export default function InviteClaimPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authenticatedFetch, isInitialized } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validate invitation on mount
  useEffect(() => {
    async function validateInvitation() {
      try {
        const res = await fetch(`${API_URL}/invites/validate/${token}`);
        const data = await handleApiResponse(res, 'Invalid invitation');

        setInvitation(data.data.invitation);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsValidating(false);
      }
    }

    if (token) {
      validateInvitation();
    }
  }, [token]);

  // Claim invitation
  const handleClaim = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: { pathname: `/invite/claim/${token}` } },
      });
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const res = await authenticatedFetch(`${API_URL}/invites/claim/${token}`, {
        method: 'POST',
      });

      const data = await handleApiResponse(res, 'Failed to claim invitation');

      setSuccess(true);

      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  // Background component
  const Background = () => (
    <>
      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-coxswain-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </>
  );

  // Loading state
  if (isValidating || !isInitialized) {
    return (
      <div className="min-h-screen bg-void-deep flex items-center justify-center">
        <Background />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <Loader2 className="w-8 h-8 text-blade-blue mx-auto mb-4 animate-spin" />
          <p className="text-text-secondary text-sm">Validating invitation...</p>
        </motion.div>
      </div>
    );
  }

  // Error state (no invitation found)
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-void-deep flex flex-col items-center justify-center p-4">
        <Background />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-red/10 border border-danger-red/20 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <XCircle className="w-7 h-7 text-danger-red" />
            </div>
            <h1 className="text-3xl font-display font-bold text-text-primary tracking-[-0.02em] mb-1">
              Invalid Invitation
            </h1>
            <p className="text-text-secondary text-sm">{error}</p>
          </div>

          <SpotlightCard
            spotlightColor="rgba(239, 68, 68, 0.08)"
            className={`
              rounded-2xl
              bg-void-elevated border border-white/5
              shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
            `}
          >
            <div className="p-6 sm:p-8 space-y-4">
              <button
                onClick={() => navigate('/login')}
                className={`
                  w-full px-4 py-3 rounded-xl font-medium
                  bg-blade-blue text-void-deep border border-blade-blue
                  hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                  active:scale-[0.98]
                  transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                `}
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/join')}
                className={`
                  w-full px-4 py-3 rounded-xl font-medium
                  bg-void-elevated/50 text-text-primary border border-white/[0.06]
                  hover:border-white/10 hover:bg-void-elevated
                  transition-all duration-200
                `}
              >
                Enter Different Code
              </button>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-void-deep flex flex-col items-center justify-center p-4">
        <Background />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <SpotlightCard
            className={`
              rounded-2xl
              bg-void-elevated border border-white/5
              shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
            `}
          >
            <div className="p-6 sm:p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,112,243,0.3)]"
              >
                <CheckCircle className="w-8 h-8 text-blade-blue" />
              </motion.div>

              <h2 className="text-2xl font-display font-bold text-text-primary mb-2">
                Welcome to {invitation.team.name}!
              </h2>
              <p className="text-text-secondary mb-4">
                You've successfully joined the team.
              </p>
              <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-void-deep flex flex-col items-center justify-center p-4">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 mb-4 shadow-[0_0_30px_rgba(0,112,243,0.2)]">
            <Layers className="w-7 h-7 text-blade-blue" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-[-0.02em] mb-1">
            You're Invited!
          </h1>
          <p className="text-text-secondary text-sm">You've been invited to join a rowing team</p>
        </div>

        <SpotlightCard
          className={`
            rounded-2xl
            bg-void-surface/95 backdrop-blur-2xl saturate-[180%]
            border border-transparent
            [background-image:linear-gradient(rgba(12,12,14,0.95),rgba(12,12,14,0.95)),linear-gradient(to_bottom,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]
            [background-origin:padding-box,border-box]
            [background-clip:padding-box,border-box]
            shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]
          `}
        >
          <div className="p-6 sm:p-8 space-y-6">
            {/* Team info */}
            <div className="p-4 rounded-xl bg-void-deep/50 border border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blade-blue/15 border border-blade-blue/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.15)]">
                  <Users className="w-6 h-6 text-blade-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {invitation.team.name}
                  </h3>
                  <p className="text-sm text-text-muted font-mono">
                    @{invitation.team.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Athlete info (if specific athlete) */}
            {invitation.athleteName && (
              <div className="p-4 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
                  Claiming athlete profile
                </p>
                <p className="font-medium text-text-primary">
                  {invitation.athleteName}
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-danger-red/10 border border-danger-red/20 text-danger-red text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Action buttons */}
            {isAuthenticated ? (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className={`
                  w-full px-4 py-3 rounded-xl font-medium
                  bg-blade-blue text-void-deep border border-blade-blue
                  hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  flex items-center justify-center gap-2
                `}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login', {
                    state: { from: { pathname: `/invite/claim/${token}` } },
                  })}
                  className={`
                    w-full px-4 py-3 rounded-xl font-medium
                    bg-blade-blue text-void-deep border border-blade-blue
                    hover:shadow-[0_0_20px_rgba(0,112,243,0.4)]
                    active:scale-[0.98]
                    transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  `}
                >
                  Sign in to Accept
                </button>
                <button
                  onClick={() => navigate('/register', {
                    state: { from: { pathname: `/invite/claim/${token}` } },
                  })}
                  className={`
                    w-full px-4 py-3 rounded-xl font-medium
                    bg-void-elevated/50 text-text-primary border border-white/[0.06]
                    hover:border-white/10 hover:bg-void-elevated
                    transition-all duration-200
                  `}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-text-muted text-center">
              This invitation was sent to{' '}
              <span className="text-text-secondary font-mono">{invitation.email}</span>
            </p>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
