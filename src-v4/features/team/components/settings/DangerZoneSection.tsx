/**
 * Danger Zone settings section.
 *
 * Two destructive actions:
 * 1. Leave team -- all roles, with confirmation dialog
 * 2. Delete team -- admin only, requires typing team name to confirm
 *
 * Leave team retains personal workouts and redirects to personal dashboard.
 * Delete team permanently removes all team data (member data preserved).
 * Last admin cannot leave without assigning another admin first.
 */
import { useState, useCallback } from 'react';
import { IconLogOut, IconTrash, IconAlertTriangle } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useLeaveTeam, useDeleteTeam } from '../../hooks/useTeamMutations';
import { isAdmin } from '../../types';
import type { TeamDetail } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { teamRosterOptions } from '../../api';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DangerZoneSectionProps {
  team: TeamDetail;
  isOwner: boolean;
}

export function DangerZoneSection({ team, isOwner }: DangerZoneSectionProps) {
  const leaveMutation = useLeaveTeam();
  const deleteMutation = useDeleteTeam();

  const { data: members = [] } = useQuery(teamRosterOptions(team.id));
  const adminCount = members.filter((m) => isAdmin(m.role)).length;
  const isLastAdmin = isOwner && adminCount <= 1;

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const handleLeave = useCallback(() => {
    leaveMutation.mutate(team.id);
  }, [leaveMutation, team.id]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(team.id);
  }, [deleteMutation, team.id]);

  const deleteNameMatches = deleteConfirmName.trim() === team.name;

  return (
    <div className="flex flex-col gap-6">
      {/* Leave team */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <IconLogOut width={18} height={18} className="text-data-poor mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-display font-semibold text-text-bright">Leave team</h3>
            <p className="text-xs text-text-dim mt-0.5">
              Your personal workouts and data will be preserved. You can rejoin later with a new
              invite code.
            </p>
          </div>
        </div>

        {isLastAdmin && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-teal/10 border border-accent-teal/20 px-3 py-2">
            <IconAlertTriangle width={14} height={14} className="text-accent-teal shrink-0" />
            <span className="text-xs text-accent-teal">
              You are the only admin. Promote another member to admin before leaving.
            </span>
          </div>
        )}

        {!showLeaveConfirm ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={isLastAdmin}
            onClick={() => setShowLeaveConfirm(true)}
            className="self-start"
          >
            <IconLogOut width={14} height={14} />
            Leave team
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-void-deep/30 border border-edge-default p-4">
            <p className="text-sm text-text-bright">
              Are you sure you want to leave <strong>{team.name}</strong>?
            </p>
            <p className="text-xs text-text-dim">
              Your personal workouts and data will be preserved.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="!bg-data-poor hover:!bg-data-poor/90"
                loading={leaveMutation.isPending}
                onClick={handleLeave}
              >
                Leave Team
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete team -- admin only */}
      {isOwner && (
        <div className="flex flex-col gap-3 pt-4 border-t border-data-poor/10">
          <div className="flex items-start gap-3">
            <IconTrash width={18} height={18} className="text-data-poor mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-display font-semibold text-text-bright">Delete team</h3>
              <p className="text-xs text-text-dim mt-0.5">
                This action cannot be undone. All team data will be permanently deleted. Member
                personal data is preserved.
              </p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="self-start !text-data-poor !border-data-poor/30 hover:!bg-data-poor/10"
            >
              <IconTrash width={14} height={14} />
              Delete team
            </Button>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl bg-data-poor/5 border border-data-poor/20 p-4">
              <p className="text-sm text-text-bright">
                Type <strong className="font-mono">{team.name}</strong> to confirm deletion:
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={team.name}
                className="h-10 w-full rounded-xl px-3 text-sm bg-void-raised text-text-bright border border-data-poor/30 focus:border-data-poor focus:ring-1 focus:ring-data-poor/30 focus:outline-none transition-colors duration-150"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="!bg-data-poor hover:!bg-data-poor/90"
                  disabled={!deleteNameMatches}
                  loading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  Permanently delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
