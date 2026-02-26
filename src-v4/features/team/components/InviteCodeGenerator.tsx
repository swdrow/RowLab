/**
 * Invite code generator component.
 *
 * Generates role-specific invite codes with configurable expiry and usage limits.
 * Shows formatted invite links with copy-to-clipboard functionality.
 *
 * Used in:
 * - CreateTeamWizard (step 3) with compact mode
 * - TeamSettings (Invites section) with full code list
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IconCopy,
  IconCheck,
  IconLink,
  IconTrash,
  IconShield,
  IconUsers,
} from '@/components/icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useGenerateInviteCode, useRevokeInviteCode } from '../hooks/useTeamMutations';
import { inviteCodesOptions } from '../api';
import type { GenerateInviteCodeInput, InviteCode } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteCodeGeneratorProps {
  teamId: string;
  /** Compact mode hides existing codes list (used in create wizard) */
  compact?: boolean;
}

type ExpiryOption = GenerateInviteCodeInput['expiry'];
type MaxUsesOption = GenerateInviteCodeInput['maxUses'];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPIRY_OPTIONS: { value: ExpiryOption; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never' },
];

const MAX_USES_OPTIONS: { value: MaxUsesOption; label: string }[] = [
  { value: 1, label: '1 use' },
  { value: 5, label: '5 uses' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: null, label: 'Unlimited' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InviteCodeGenerator({ teamId, compact = false }: InviteCodeGeneratorProps) {
  const [role, setRole] = useState<'COACH' | 'ATHLETE'>('ATHLETE');
  const [expiry, setExpiry] = useState<ExpiryOption>('7d');
  const [maxUses, setMaxUses] = useState<MaxUsesOption>(null);
  const [generatedCode, setGeneratedCode] = useState<InviteCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateMutation = useGenerateInviteCode(teamId);
  const revokeMutation = useRevokeInviteCode(teamId);

  // Fetch existing codes (only in full mode)
  const { data: existingCodes } = useQuery({
    ...inviteCodesOptions(teamId),
    enabled: !compact && !!teamId,
  });

  const handleGenerate = useCallback(() => {
    generateMutation.mutate(
      { role, expiry, maxUses },
      {
        onSuccess: (code) => {
          setGeneratedCode(code);
        },
      }
    );
  }, [role, expiry, maxUses, generateMutation]);

  const getInviteUrl = useCallback((code: string, codeRole: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite/${code}?role=${codeRole.toLowerCase()}`;
  }, []);

  const handleCopy = useCallback(
    async (code: string, codeRole: string, id?: string) => {
      const url = getInviteUrl(code, codeRole);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(id ?? code);
        toast.success('Link copied!');
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // Fallback for non-secure contexts
        toast.error('Failed to copy. Try selecting the URL manually.');
      }
    },
    [getInviteUrl]
  );

  const handleRevoke = useCallback(
    (codeId: string) => {
      revokeMutation.mutate(codeId);
    },
    [revokeMutation]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Generator controls */}
      <div className="flex flex-col gap-3">
        {/* Role toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-default">Invite as</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole('COACH')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                role === 'COACH'
                  ? 'border-accent-teal bg-accent-teal/10 text-accent-teal'
                  : 'border-edge-default bg-void-raised text-text-dim hover:bg-void-overlay'
              }`}
            >
              <IconShield width={14} height={14} />
              Coach
            </button>
            <button
              type="button"
              onClick={() => setRole('ATHLETE')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                role === 'ATHLETE'
                  ? 'border-accent-teal bg-accent-teal/10 text-accent-teal'
                  : 'border-edge-default bg-void-raised text-text-dim hover:bg-void-overlay'
              }`}
            >
              <IconUsers width={14} height={14} />
              Athlete
            </button>
          </div>
        </div>

        {/* Expiry + max uses row */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="invite-expiry" className="text-sm font-medium text-text-default">
              Expires
            </label>
            <select
              id="invite-expiry"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiryOption)}
              className="h-10 w-full rounded-xl px-3 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 appearance-none cursor-pointer"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="invite-max-uses" className="text-sm font-medium text-text-default">
              Max uses
            </label>
            <select
              id="invite-max-uses"
              value={maxUses ?? 'unlimited'}
              onChange={(e) =>
                setMaxUses(
                  e.target.value === 'unlimited' ? null : (Number(e.target.value) as MaxUsesOption)
                )
              }
              className="h-10 w-full rounded-xl px-3 text-sm bg-void-raised text-text-bright border border-edge-default focus:border-accent-teal focus:ring-1 focus:ring-accent/30 focus:outline-none transition-colors duration-150 appearance-none cursor-pointer"
            >
              {MAX_USES_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value ?? 'unlimited'}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <Button
          size="md"
          variant="secondary"
          className="w-full"
          onClick={handleGenerate}
          loading={generateMutation.isPending}
        >
          <IconLink width={16} height={16} />
          Generate invite link
        </Button>
      </div>

      {/* Generated code display */}
      {generatedCode && (
        <div className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-text-faint">
              {generatedCode.role} invite
            </span>
            <span className="font-mono text-lg font-bold tracking-widest text-accent-teal">
              {generatedCode.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={getInviteUrl(generatedCode.code, generatedCode.role)}
              className="flex-1 h-9 rounded-lg px-3 text-xs bg-void-raised text-text-dim border border-edge-default font-mono truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={() =>
                void handleCopy(generatedCode.code, generatedCode.role, generatedCode.id)
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-edge-default bg-void-raised text-text-dim hover:bg-void-overlay hover:text-text-bright transition-colors"
              title="Copy link"
            >
              {copiedId === generatedCode.id ? (
                <IconCheck width={14} height={14} className="text-data-good" />
              ) : (
                <IconCopy width={14} height={14} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing codes list (full mode only) */}
      {!compact && existingCodes && existingCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-display font-medium text-text-default">
            Active invite codes
          </h4>
          <div className="flex flex-col gap-1.5">
            {existingCodes.map((code) => (
              <InviteCodeRow
                key={code.id}
                code={code}
                copiedId={copiedId}
                onCopy={() => void handleCopy(code.code, code.role, code.id)}
                onRevoke={() => handleRevoke(code.id)}
                isRevoking={revokeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite code row (for existing codes list)
// ---------------------------------------------------------------------------

function InviteCodeRow({
  code,
  copiedId,
  onCopy,
  onRevoke,
  isRevoking,
}: {
  code: InviteCode;
  copiedId: string | null;
  onCopy: () => void;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const expiryText = code.expiresAt
    ? `Expires ${new Date(code.expiresAt).toLocaleDateString()}`
    : 'No expiry';
  const usesText = code.maxUses
    ? `${code.usesCount}/${code.maxUses} uses`
    : `${code.usesCount} uses`;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-void-raised/50 border border-edge-default px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-bright tracking-wide">
            {code.code}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              code.role === 'COACH'
                ? 'bg-accent-teal/10 text-accent-teal'
                : 'bg-edge-default/50 text-text-dim'
            }`}
          >
            {code.role}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-faint mt-0.5">
          <span>{expiryText}</span>
          <span className="text-edge-default">|</span>
          <span>{usesText}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onCopy}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:text-text-bright hover:bg-void-overlay transition-colors"
          title="Copy invite link"
        >
          {copiedId === code.id ? (
            <IconCheck width={13} height={13} className="text-data-good" />
          ) : (
            <IconCopy width={13} height={13} />
          )}
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={isRevoking}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-faint hover:text-data-poor hover:bg-data-poor/10 transition-colors disabled:opacity-50"
          title="Revoke code"
        >
          <IconTrash width={13} height={13} />
        </button>
      </div>
    </div>
  );
}
