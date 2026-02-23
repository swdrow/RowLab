/**
 * Account settings section -- email display, password change, and danger zone.
 * Password change posts to /api/auth/change-password (or shows error if endpoint missing).
 * Account deletion deferred.
 * // TODO(phase-53): Wire to account deletion endpoint
 */
import { useState, useCallback } from 'react';
import { IconSettings, IconMail, IconLock, IconAlertTriangle, IconCheckCircle, IconXCircle } from '@/components/icons';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/useAuth';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/* Password Change Form                                                 */
/* ------------------------------------------------------------------ */

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPassword || !newPassword) return;
      if (newPassword.length < 8) {
        setStatus('error');
        setErrorMessage('New password must be at least 8 characters');
        return;
      }

      setStatus('loading');
      setErrorMessage('');

      try {
        await api.post('/api/v1/auth/change-password', {
          currentPassword,
          newPassword,
        });
        setStatus('success');
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setStatus('idle'), 3000);
      } catch (err: unknown) {
        setStatus('error');
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMessage(
          axiosErr.response?.data?.error?.message || 'Failed to change password. Please try again.'
        );
      }
    },
    [currentPassword, newPassword]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-bright mb-1.5">
          Current Password
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          className="
            w-full px-3 py-2 rounded-lg text-sm
            bg-void-surface border border-edge-default text-text-bright
            placeholder:text-text-faint
            focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent-teal
            transition-colors
          "
          placeholder="Enter current password"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-bright mb-1.5">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          className="
            w-full px-3 py-2 rounded-lg text-sm
            bg-void-surface border border-edge-default text-text-bright
            placeholder:text-text-faint
            focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent-teal
            transition-colors
          "
          placeholder="At least 8 characters"
        />
      </div>

      {/* Status feedback */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-data-good">
          <IconCheckCircle className="w-4 h-4" />
          Password changed successfully
        </div>
      )}
      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-accent-coral">
          <IconXCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        loading={status === 'loading'}
        disabled={!currentPassword || !newPassword}
      >
        Change Password
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* AccountSection                                                       */
/* ------------------------------------------------------------------ */

export function AccountSection() {
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteAccount = useCallback(() => {
    // TODO(phase-53): Wire to account deletion endpoint
    setDeleteOpen(false);
    alert('Account deletion is not yet implemented. Your account is safe.');
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Account"
        description="Manage your account credentials and data"
        icon={<IconSettings className="w-4 h-4" />}
      />

      {/* Email Display */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <IconMail className="w-4 h-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-bright">Email Address</h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-void-deep border border-edge-default text-text-dim
              cursor-not-allowed
            "
          />
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-data-good/10 text-data-good">
            <IconCheckCircle className="w-3 h-3" />
            Verified
          </span>
        </div>
      </Card>

      {/* Password Change */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <IconLock className="w-4 h-4 text-accent-teal" />
          <h3 className="text-sm font-semibold text-text-bright">Change Password</h3>
        </div>
        <PasswordChangeForm />
      </Card>

      {/* Danger Zone */}
      <Card className="border border-accent-coral/30">
        <div className="flex items-center gap-2 mb-3">
          <IconAlertTriangle className="w-4 h-4 text-accent-coral" />
          <h3 className="text-sm font-semibold text-accent-coral">Danger Zone</h3>
        </div>
        <p className="text-sm text-text-dim mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            bg-accent-coral/10 border border-accent-coral/30 text-accent-coral
            hover:bg-accent-coral/20 transition-colors cursor-pointer
          "
        >
          Delete Account
        </button>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          description="This action is permanent and cannot be undone. All your workouts, PRs, and team memberships will be deleted."
          confirmLabel="Delete My Account"
          variant="danger"
        />
      </Card>
    </div>
  );
}
