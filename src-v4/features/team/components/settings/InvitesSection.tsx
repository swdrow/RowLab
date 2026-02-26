/**
 * Invites settings section.
 *
 * Renders the InviteCodeGenerator in full (non-compact) mode,
 * showing the generator controls and existing active codes list.
 * Only visible to Admin and Coach roles.
 */
import { InviteCodeGenerator } from '../InviteCodeGenerator';

interface InvitesSectionProps {
  teamId: string;
}

export function InvitesSection({ teamId }: InvitesSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text-dim mb-2">
        Generate invite links to share with new team members. Each code can be configured with a
        role, expiry, and usage limit.
      </p>
      <InviteCodeGenerator teamId={teamId} compact={false} />
    </div>
  );
}
