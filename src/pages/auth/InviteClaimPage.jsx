import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

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
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || 'Invalid invitation');
        }

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
      // Redirect to login with return URL
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to claim invitation');
      }

      setSuccess(true);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (isValidating || !isInitialized) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 text-accent mx-auto mb-4" />
          <p className="text-text-secondary">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

        <Card variant="elevated" padding="lg" radius="xl" className="relative z-10 max-w-md w-full">
          <CardContent className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-spectrum-red/20 flex items-center justify-center">
              <XCircleIcon className="w-8 h-8 text-spectrum-red" />
            </div>

            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Invalid Invitation
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate('/join')}>
                Enter Different Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

        <Card variant="elevated" padding="lg" radius="xl" className="relative z-10 max-w-md w-full">
          <CardContent className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-success" />
            </div>

            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Welcome to {invitation.team.name}!
            </h2>
            <p className="text-text-secondary mb-4">
              You've successfully joined the team.
            </p>
            <p className="text-text-tertiary text-sm">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-text-primary mb-2">
            RowLab
          </h1>
          <p className="text-text-secondary">Team Invitation</p>
        </div>

        <Card variant="glow" padding="lg" radius="xl">
          <CardHeader>
            <div className="text-center w-full">
              <CardTitle className="text-2xl">You're Invited!</CardTitle>
              <CardDescription className="mt-2">
                You've been invited to join a rowing team
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Team info */}
            <div className="p-4 rounded-lg bg-surface-800 border border-border-subtle">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {invitation.team.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {invitation.team.name}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    @{invitation.team.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Athlete info (if specific athlete) */}
            {invitation.athleteName && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-text-secondary mb-1">
                  Claiming athlete profile:
                </p>
                <p className="font-medium text-text-primary">
                  {invitation.athleteName}
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-spectrum-red/10 border border-spectrum-red/30 text-spectrum-red text-sm">
                {error}
              </div>
            )}

            {/* Action buttons */}
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isClaiming}
                onClick={handleClaim}
              >
                Accept Invitation
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login', {
                    state: { from: { pathname: `/invite/claim/${token}` } },
                  })}
                >
                  Sign in to Accept
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/register', {
                    state: { from: { pathname: `/invite/claim/${token}` } },
                  })}
                >
                  Create Account
                </Button>
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-text-tertiary text-center">
              This invitation was sent to {invitation.email}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Icons
function LoadingSpinner({ className }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function XCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
