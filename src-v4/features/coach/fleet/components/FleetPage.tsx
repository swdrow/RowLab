/**
 * FleetPage: fleet management with shells and oar sets tabs.
 *
 * Coach sees full CRUD; athletes with read-only access see data
 * but no Add/Edit/Delete buttons plus a ReadOnlyBadge in the header.
 *
 * Uses optimistic mutations, table display, and dialog overlays for forms.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Anchor, Plus, Pencil, Trash2, SailboatIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { fadeIn, slideUp } from '@/lib/animations';

import {
  shellsOptions,
  oarSetsOptions,
  useCreateShell,
  useUpdateShell,
  useDeleteShell,
  useCreateOarSet,
  useUpdateOarSet,
  useDeleteOarSet,
} from '../api';
import type {
  Shell,
  OarSet,
  CreateShellInput,
  UpdateShellInput,
  CreateOarSetInput,
  UpdateOarSetInput,
} from '../types';
import {
  SHELL_TYPE_DISPLAY,
  WEIGHT_CLASS_DISPLAY,
  OAR_TYPE_DISPLAY,
  STATUS_DISPLAY,
  STATUS_COLOR,
  STATUS_DOT,
} from '../types';

import { FleetSkeleton } from './FleetSkeleton';
import { ShellForm } from './ShellForm';
import { OarSetForm } from './OarSetForm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FleetTab = 'shells' | 'oars';

interface FleetPageProps {
  teamId: string;
  readOnly: boolean;
}

// ---------------------------------------------------------------------------
// Dialog overlay component (native <dialog> for accessibility)
// ---------------------------------------------------------------------------

function DialogOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto max-w-lg w-full rounded-xl open:flex open:flex-col"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            {...slideUp}
            className="bg-ink-base border border-ink-border rounded-xl p-6 shadow-card"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation inline
// ---------------------------------------------------------------------------

function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-secondary">Delete {name}?</span>
      <Button
        variant="ghost"
        size="sm"
        className="!text-data-poor !h-7 !px-2 !text-xs"
        onClick={onConfirm}
        loading={isPending}
      >
        Delete
      </Button>
      <Button variant="ghost" size="sm" className="!h-7 !px-2 !text-xs" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shells table
// ---------------------------------------------------------------------------

function ShellsTable({
  shells,
  readOnly,
  onEdit,
  onDelete,
  deletingId,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}: {
  shells: Shell[];
  readOnly: boolean;
  onEdit: (shell: Shell) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-border/50">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Type
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider hidden sm:table-cell">
              Weight
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider hidden md:table-cell">
              Rigging
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Status
            </th>
            {!readOnly && (
              <th className="text-right py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {shells.map((shell) => (
            <motion.tr
              key={shell.id}
              layout
              className="border-b border-ink-border/20 hover:bg-ink-hover/30 transition-colors"
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[shell.status]}`}
                    title={STATUS_DISPLAY[shell.status]}
                  />
                  <div>
                    <span className="font-medium text-ink-primary">{shell.name}</span>
                    <span className="block text-xs text-ink-muted">{shell.boatClass}</span>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-3 text-ink-secondary">{SHELL_TYPE_DISPLAY[shell.type]}</td>
              <td className="py-2.5 px-3 text-ink-secondary hidden sm:table-cell">
                {WEIGHT_CLASS_DISPLAY[shell.weightClass]}
              </td>
              <td className="py-2.5 px-3 text-ink-secondary hidden md:table-cell">
                {shell.rigging === 'SWEEP' ? 'Sweep' : 'Scull'}
              </td>
              <td className="py-2.5 px-3">
                <span className={`text-xs font-medium ${STATUS_COLOR[shell.status]}`}>
                  {STATUS_DISPLAY[shell.status]}
                </span>
              </td>
              {!readOnly && (
                <td className="py-2.5 px-3 text-right">
                  {deletingId === shell.id ? (
                    <DeleteConfirm
                      name={shell.name}
                      onConfirm={onConfirmDelete}
                      onCancel={onCancelDelete}
                      isPending={isDeleting}
                    />
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(shell)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-ink-hover transition-colors"
                        aria-label={`Edit ${shell.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(shell.id)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-data-poor hover:bg-data-poor/10 transition-colors"
                        aria-label={`Delete ${shell.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Oar sets table
// ---------------------------------------------------------------------------

function OarSetsTable({
  oarSets,
  readOnly,
  onEdit,
  onDelete,
  deletingId,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}: {
  oarSets: OarSet[];
  readOnly: boolean;
  onEdit: (oarSet: OarSet) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-border/50">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Name
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Type
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Count
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
              Status
            </th>
            {!readOnly && (
              <th className="text-right py-2.5 px-3 text-xs font-medium text-ink-tertiary uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {oarSets.map((oarSet) => (
            <motion.tr
              key={oarSet.id}
              layout
              className="border-b border-ink-border/20 hover:bg-ink-hover/30 transition-colors"
            >
              <td className="py-2.5 px-3">
                <span className="font-medium text-ink-primary">{oarSet.name}</span>
                {oarSet.notes && (
                  <span className="block text-xs text-ink-muted truncate max-w-[200px]">
                    {oarSet.notes}
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3 text-ink-secondary">{OAR_TYPE_DISPLAY[oarSet.type]}</td>
              <td className="py-2.5 px-3 text-ink-secondary">{oarSet.count}</td>
              <td className="py-2.5 px-3">
                <span className={`text-xs font-medium ${STATUS_COLOR[oarSet.status]}`}>
                  {STATUS_DISPLAY[oarSet.status]}
                </span>
              </td>
              {!readOnly && (
                <td className="py-2.5 px-3 text-right">
                  {deletingId === oarSet.id ? (
                    <DeleteConfirm
                      name={oarSet.name}
                      onConfirm={onConfirmDelete}
                      onCancel={onCancelDelete}
                      isPending={isDeleting}
                    />
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(oarSet)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-ink-hover transition-colors"
                        aria-label={`Edit ${oarSet.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(oarSet.id)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-data-poor hover:bg-data-poor/10 transition-colors"
                        aria-label={`Delete ${oarSet.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FleetPage({ teamId, readOnly }: FleetPageProps) {
  const [activeTab, setActiveTab] = useState<FleetTab>('shells');

  // Queries
  const { data: shells = [], isLoading: shellsLoading } = useQuery(shellsOptions(teamId));
  const { data: oarSets = [], isLoading: oarsLoading } = useQuery(oarSetsOptions(teamId));

  // Shell mutations
  const createShell = useCreateShell(teamId);
  const updateShell = useUpdateShell(teamId);
  const deleteShell = useDeleteShell(teamId);

  // Oar set mutations
  const createOarSet = useCreateOarSet(teamId);
  const updateOarSet = useUpdateOarSet(teamId);
  const deleteOarSet = useDeleteOarSet(teamId);

  // Dialog state
  const [shellDialogOpen, setShellDialogOpen] = useState(false);
  const [editingShell, setEditingShell] = useState<Shell | null>(null);
  const [oarDialogOpen, setOarDialogOpen] = useState(false);
  const [editingOarSet, setEditingOarSet] = useState<OarSet | null>(null);

  // Delete confirmation state
  const [deletingShellId, setDeletingShellId] = useState<string | null>(null);
  const [deletingOarSetId, setDeletingOarSetId] = useState<string | null>(null);

  // Shell CRUD handlers
  const handleAddShell = useCallback(() => {
    setEditingShell(null);
    setShellDialogOpen(true);
  }, []);

  const handleEditShell = useCallback((shell: Shell) => {
    setEditingShell(shell);
    setShellDialogOpen(true);
  }, []);

  const handleShellSubmit = useCallback(
    (data: CreateShellInput) => {
      if (editingShell) {
        updateShell.mutate(
          { id: editingShell.id, input: data as UpdateShellInput },
          { onSuccess: () => setShellDialogOpen(false) }
        );
      } else {
        createShell.mutate(data, { onSuccess: () => setShellDialogOpen(false) });
      }
    },
    [editingShell, createShell, updateShell]
  );

  const handleConfirmDeleteShell = useCallback(() => {
    if (deletingShellId) {
      deleteShell.mutate(deletingShellId, {
        onSuccess: () => setDeletingShellId(null),
      });
    }
  }, [deletingShellId, deleteShell]);

  // Oar set CRUD handlers
  const handleAddOarSet = useCallback(() => {
    setEditingOarSet(null);
    setOarDialogOpen(true);
  }, []);

  const handleEditOarSet = useCallback((oarSet: OarSet) => {
    setEditingOarSet(oarSet);
    setOarDialogOpen(true);
  }, []);

  const handleOarSetSubmit = useCallback(
    (data: CreateOarSetInput) => {
      if (editingOarSet) {
        updateOarSet.mutate(
          { id: editingOarSet.id, input: data as UpdateOarSetInput },
          { onSuccess: () => setOarDialogOpen(false) }
        );
      } else {
        createOarSet.mutate(data, { onSuccess: () => setOarDialogOpen(false) });
      }
    },
    [editingOarSet, createOarSet, updateOarSet]
  );

  const handleConfirmDeleteOarSet = useCallback(() => {
    if (deletingOarSetId) {
      deleteOarSet.mutate(deletingOarSetId, {
        onSuccess: () => setDeletingOarSetId(null),
      });
    }
  }, [deletingOarSetId, deleteOarSet]);

  const isLoading = shellsLoading || oarsLoading;

  return (
    <motion.div {...fadeIn} className="flex flex-col gap-6">
      {/* Header */}
      <SectionHeader
        title="Fleet Management"
        description="Manage your team's shells and oar sets"
        icon={<SailboatIcon className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-3">
            {readOnly && <ReadOnlyBadge />}
            {!readOnly && (
              <Button size="sm" onClick={activeTab === 'shells' ? handleAddShell : handleAddOarSet}>
                <Plus size={16} />
                {activeTab === 'shells' ? 'Add Shell' : 'Add Oar Set'}
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-well/40 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('shells')}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              activeTab === 'shells'
                ? 'bg-ink-raised text-ink-primary shadow-sm'
                : 'text-ink-muted hover:text-ink-secondary'
            }
          `.trim()}
        >
          Shells
          {shells.length > 0 && (
            <span className="ml-1.5 text-xs text-ink-tertiary">({shells.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('oars')}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              activeTab === 'oars'
                ? 'bg-ink-raised text-ink-primary shadow-sm'
                : 'text-ink-muted hover:text-ink-secondary'
            }
          `.trim()}
        >
          Oars
          {oarSets.length > 0 && (
            <span className="ml-1.5 text-xs text-ink-tertiary">({oarSets.length})</span>
          )}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <FleetSkeleton />
      ) : (
        <GlassCard padding="none">
          <AnimatePresence mode="wait">
            {activeTab === 'shells' ? (
              <motion.div key="shells" {...fadeIn}>
                {shells.length === 0 ? (
                  <div className="py-12 px-4">
                    <EmptyState
                      icon={SailboatIcon}
                      title="No shells yet"
                      description="Add your first shell to start tracking your fleet."
                      action={
                        readOnly ? undefined : { label: 'Add Shell', onClick: handleAddShell }
                      }
                    />
                  </div>
                ) : (
                  <ShellsTable
                    shells={shells}
                    readOnly={readOnly}
                    onEdit={handleEditShell}
                    onDelete={setDeletingShellId}
                    deletingId={deletingShellId}
                    isDeleting={deleteShell.isPending}
                    onConfirmDelete={handleConfirmDeleteShell}
                    onCancelDelete={() => setDeletingShellId(null)}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div key="oars" {...fadeIn}>
                {oarSets.length === 0 ? (
                  <div className="py-12 px-4">
                    <EmptyState
                      icon={Anchor}
                      title="No oar sets yet"
                      description="Add your first oar set to start tracking your equipment."
                      action={
                        readOnly ? undefined : { label: 'Add Oar Set', onClick: handleAddOarSet }
                      }
                    />
                  </div>
                ) : (
                  <OarSetsTable
                    oarSets={oarSets}
                    readOnly={readOnly}
                    onEdit={handleEditOarSet}
                    onDelete={setDeletingOarSetId}
                    deletingId={deletingOarSetId}
                    isDeleting={deleteOarSet.isPending}
                    onConfirmDelete={handleConfirmDeleteOarSet}
                    onCancelDelete={() => setDeletingOarSetId(null)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      )}

      {/* Shell form dialog */}
      <DialogOverlay open={shellDialogOpen} onClose={() => setShellDialogOpen(false)}>
        <ShellForm
          shell={editingShell}
          onSubmit={handleShellSubmit}
          onCancel={() => setShellDialogOpen(false)}
          isPending={editingShell ? updateShell.isPending : createShell.isPending}
        />
      </DialogOverlay>

      {/* Oar set form dialog */}
      <DialogOverlay open={oarDialogOpen} onClose={() => setOarDialogOpen(false)}>
        <OarSetForm
          oarSet={editingOarSet}
          onSubmit={handleOarSetSubmit}
          onCancel={() => setOarDialogOpen(false)}
          isPending={editingOarSet ? updateOarSet.isPending : createOarSet.isPending}
        />
      </DialogOverlay>
    </motion.div>
  );
}
