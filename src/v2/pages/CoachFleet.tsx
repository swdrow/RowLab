import { useState } from 'react';
import { useShells } from '../hooks/useShells';
import { useOarSets } from '../hooks/useOarSets';
import { ShellsTable, OarsTable, ShellForm, OarSetForm } from '../components/fleet';
import { CrudModal } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import type { Shell, OarSet } from '../types/coach';
import { Plus } from 'lucide-react';

export default function CoachFleet() {
  // Shell modal state
  const [isShellModalOpen, setIsShellModalOpen] = useState(false);
  const [editingShell, setEditingShell] = useState<Shell | null>(null);

  // Oar set modal state
  const [isOarModalOpen, setIsOarModalOpen] = useState(false);
  const [editingOarSet, setEditingOarSet] = useState<OarSet | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'shells' | 'oars'>('shells');

  // Hooks
  const {
    shells,
    isLoading: shellsLoading,
    createShell,
    updateShell,
    deleteShell,
    isCreating: shellCreating,
    isUpdating: shellUpdating,
  } = useShells();
  const {
    oarSets,
    isLoading: oarsLoading,
    createOarSet,
    updateOarSet,
    deleteOarSet,
    isCreating: oarCreating,
    isUpdating: oarUpdating,
  } = useOarSets();

  // Auth
  const { activeTeamRole } = useAuth();
  const canEdit = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

  // Shell handlers
  const handleShellSubmit = (data: any) => {
    if (editingShell) {
      updateShell(
        { id: editingShell.id, ...data },
        {
          onSuccess: () => {
            setIsShellModalOpen(false);
            setEditingShell(null);
          },
        }
      );
    } else {
      createShell(data, {
        onSuccess: () => setIsShellModalOpen(false),
      });
    }
  };

  const handleEditShell = (shell: Shell) => {
    setEditingShell(shell);
    setIsShellModalOpen(true);
  };

  const handleDeleteShell = (id: string) => {
    if (window.confirm('Are you sure you want to delete this shell?')) {
      deleteShell(id);
    }
  };

  // Oar set handlers (same pattern)
  const handleOarSubmit = (data: any) => {
    if (editingOarSet) {
      updateOarSet(
        { id: editingOarSet.id, ...data },
        {
          onSuccess: () => {
            setIsOarModalOpen(false);
            setEditingOarSet(null);
          },
        }
      );
    } else {
      createOarSet(data, {
        onSuccess: () => setIsOarModalOpen(false),
      });
    }
  };

  const handleEditOarSet = (oarSet: OarSet) => {
    setEditingOarSet(oarSet);
    setIsOarModalOpen(true);
  };

  const handleDeleteOarSet = (id: string) => {
    if (window.confirm('Are you sure you want to delete this oar set?')) {
      deleteOarSet(id);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              Fleet Management
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Fleet
            </h1>
            <p className="text-sm text-ink-secondary mt-2">Manage shells, oars, and equipment</p>
          </div>
          {canEdit && (
            <button
              onClick={() =>
                activeTab === 'shells' ? setIsShellModalOpen(true) : setIsOarModalOpen(true)
              }
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                         bg-gradient-to-b from-accent-copper to-accent-copper-hover
                         text-white rounded-xl
                         shadow-glow-copper hover:shadow-glow-copper-lg
                         hover:-translate-y-px active:translate-y-0
                         transition-all duration-150"
            >
              <Plus size={18} />
              Add {activeTab === 'shells' ? 'Shell' : 'Oar Set'}
            </button>
          )}
        </div>
      </div>

      <div className="px-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-6 bg-ink-raised rounded-lg w-fit border border-ink-border">
          <button
            onClick={() => setActiveTab('shells')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activeTab === 'shells'
                ? 'bg-accent-copper text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink-body hover:bg-ink-hover'
            }`}
          >
            Shells ({shells?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('oars')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              activeTab === 'oars'
                ? 'bg-accent-copper text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink-body hover:bg-ink-hover'
            }`}
          >
            Oars ({oarSets?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-ink-border bg-ink-base p-4">
          {activeTab === 'shells' ? (
            shellsLoading ? (
              <div className="animate-pulse h-48 bg-ink-raised rounded" />
            ) : (
              <ShellsTable
                shells={shells || []}
                canEdit={canEdit}
                onEdit={handleEditShell}
                onDelete={handleDeleteShell}
              />
            )
          ) : oarsLoading ? (
            <div className="animate-pulse h-48 bg-ink-raised rounded" />
          ) : (
            <OarsTable
              oarSets={oarSets || []}
              canEdit={canEdit}
              onEdit={handleEditOarSet}
              onDelete={handleDeleteOarSet}
            />
          )}
        </div>
      </div>

      {/* Shell Modal */}
      <CrudModal
        isOpen={isShellModalOpen}
        onClose={() => {
          setIsShellModalOpen(false);
          setEditingShell(null);
        }}
        title={editingShell ? 'Edit Shell' : 'Add Shell'}
      >
        <ShellForm
          initialData={editingShell || undefined}
          onSubmit={handleShellSubmit}
          onCancel={() => {
            setIsShellModalOpen(false);
            setEditingShell(null);
          }}
          isSubmitting={shellCreating || shellUpdating}
        />
      </CrudModal>

      {/* Oar Set Modal */}
      <CrudModal
        isOpen={isOarModalOpen}
        onClose={() => {
          setIsOarModalOpen(false);
          setEditingOarSet(null);
        }}
        title={editingOarSet ? 'Edit Oar Set' : 'Add Oar Set'}
      >
        <OarSetForm
          initialData={editingOarSet || undefined}
          onSubmit={handleOarSubmit}
          onCancel={() => {
            setIsOarModalOpen(false);
            setEditingOarSet(null);
          }}
          isSubmitting={oarCreating || oarUpdating}
        />
      </CrudModal>
    </div>
  );
}
