/**
 * Account settings section -- email display, password change with strength meter,
 * and enhanced account deletion with two-factor gate (text + password).
 * // TODO(#28): When OAuth login is implemented, check if user.passwordHash is a real
 * bcrypt hash vs placeholder. Show "Set a password" for OAuth-only users.
 */
import { useState, useCallback, useMemo } from 'react';
import {
  IconSettings,
  IconMail,
  IconLock,
  IconAlertTriangle,
  IconCheckCircle,
  IconTrash,
} from '@/components/icons';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/features/auth/useAuth';
import { useChangePassword, useDeleteAccount } from '../api';
import { SaveIndicator } from './SaveIndicator';

/* ------------------------------------------------------------------ */
/* Password Strength Meter                                              */
/* ------------------------------------------------------------------ */

interface StrengthResult {
  score: number;
  level: 'Too weak' | 'Weak' | 'Medium' | 'Strong';
  color: string; // Tailwind bg class
  textColor: string;
}

function getPasswordStrength(password: string): StrengthResult {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1)
    return { score, level: 'Too weak', color: 'bg-accent-coral', textColor: 'text-accent-coral' };
  if (score === 2)
    return { score, level: 'Weak', color: 'bg-accent-coral', textColor: 'text-accent-coral' };
  if (score === 3)
    return { score, level: 'Medium', color: 'bg-accent-sand', textColor: 'text-accent-sand' };
  return { score, level: 'Strong', color: 'bg-accent-teal', textColor: 'text-accent-teal' };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const segments = 4;
  const filled = strength.score <= 1 ? 1 : strength.score === 2 ? 2 : strength.score === 3 ? 3 : 4;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              i < filled ? strength.color : 'bg-void-deep'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.textColor}`}>{strength.level}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Password Change Form                                                 */
/* ------------------------------------------------------------------ */

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const changePassword = useChangePassword();
  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && strength.score >= 3;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSaveStatus('idle');
      setErrorMessage('');

      changePassword.mutate(
        { currentPassword, newPassword },
        {
          onSuccess: () => {
            setSaveStatus('saved');
            setCurrentPassword('');
            setNewPassword('');
            setTimeout(() => setSaveStatus('idle'), 3000);
          },
          onError: (err: unknown) => {
            setSaveStatus('error');
            const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
            setErrorMessage(
              axiosErr.response?.data?.error?.message ||
                'Failed to change password. Please try again.'
            );
          },
        }
      );
    },
    [currentPassword, newPassword, canSubmit, changePassword]
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
        {newPassword.length > 0 && (
          <div className="mt-2">
            <PasswordStrengthMeter password={newPassword} />
          </div>
        )}
      </div>

      {/* Status feedback */}
      <SaveIndicator status={saveStatus} errorMessage={errorMessage} />

      <Button type="submit" size="sm" loading={changePassword.isPending} disabled={!canSubmit}>
        Change Password
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Delete Account Dialog                                                */
/* ------------------------------------------------------------------ */

function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const deleteAccount = useDeleteAccount();
  const canDelete = confirmText === 'DELETE' && password.length > 0;

  const handleDelete = useCallback(() => {
    if (!canDelete) return;
    setError('');

    deleteAccount.mutate(
      { password },
      {
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
          setError(
            axiosErr.response?.data?.error?.message || 'Failed to delete account. Please try again.'
          );
        },
      }
    );
  }, [canDelete, password, deleteAccount]);

  // Reset form when dialog closes
  const handleClose = useCallback(() => {
    setConfirmText('');
    setPassword('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} title="Delete Your Account" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* What will be deleted */}
        <div className="rounded-lg bg-accent-coral/5 border border-accent-coral/20 p-3">
          <p className="text-sm font-medium text-accent-coral mb-2">
            The following will be removed:
          </p>
          <ul className="text-xs text-text-dim space-y-1 list-disc pl-4">
            <li>All workouts and training history</li>
            <li>Team memberships and roles</li>
            <li>Profile information and preferences</li>
            <li>Connected integrations (Concept2, Strava)</li>
          </ul>
        </div>

        {/* Grace period note */}
        <div className="rounded-lg bg-accent-sand/10 border border-accent-sand/20 p-3">
          <p className="text-xs text-text-dim leading-relaxed">
            Your account will be deactivated for{' '}
            <span className="font-medium text-accent-sand">30 days</span> before permanent deletion.
            Contact <span className="text-accent-teal">support@oarbit.app</span> to recover during
            this window.
          </p>
        </div>

        {/* Confirmation text input */}
        <div>
          <label className="block text-sm font-medium text-text-bright mb-1.5">
            Type <span className="font-mono text-accent-coral">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-void-surface border border-edge-default text-text-bright
              placeholder:text-text-faint
              focus:outline-none focus:ring-1 focus:ring-accent-coral/50 focus:border-accent-coral
              transition-colors
            "
            placeholder="DELETE"
          />
        </div>

        {/* Password input */}
        <div>
          <label className="block text-sm font-medium text-text-bright mb-1.5">
            Enter your password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="
              w-full px-3 py-2 rounded-lg text-sm
              bg-void-surface border border-edge-default text-text-bright
              placeholder:text-text-faint
              focus:outline-none focus:ring-1 focus:ring-accent-coral/50 focus:border-accent-coral
              transition-colors
            "
            placeholder="Your password"
          />
        </div>

        {/* Error message */}
        {error && <p className="text-sm text-accent-coral">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={deleteAccount.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={handleDelete}
            disabled={!canDelete || deleteAccount.isPending}
            loading={deleteAccount.isPending}
          >
            <IconTrash className="w-4 h-4" />
            Delete My Account
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* AccountSection                                                       */
/* ------------------------------------------------------------------ */

export function AccountSection() {
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          <h3 className="text-sm font-display font-semibold text-text-bright">Email Address</h3>
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
          <h3 className="text-sm font-display font-semibold text-text-bright">Change Password</h3>
        </div>
        <PasswordChangeForm />
      </Card>

      {/* Danger Zone */}
      <Card className="border border-accent-coral/30">
        <div className="flex items-center gap-2 mb-3">
          <IconAlertTriangle className="w-4 h-4 text-accent-coral" />
          <h3 className="text-sm font-display font-semibold text-accent-coral">Danger Zone</h3>
        </div>
        <p className="text-sm text-text-dim mb-4">
          Deactivate your account. Your data will be preserved for 30 days before permanent
          deletion.
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

        <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
      </Card>
    </div>
  );
}
