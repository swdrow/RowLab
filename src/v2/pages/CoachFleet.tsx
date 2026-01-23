import { useState } from 'react';
import { useShells } from '../hooks/useShells';
import { useOarSets } from '../hooks/useOarSets';
import { ShellsTable, OarsTable, ShellForm, OarSetForm } from '../components/fleet';
import { CrudModal } from '../components/common';
import { useV2Auth } from '../hooks/useSharedStores';
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
  const { shells, isLoading: shellsLoading, createShell, updateShell, deleteShell, isCreating: shellCreating, isUpdating: shellUpdating } = useShells();
  const { oarSets, isLoading: oarsLoading, createOarSet, updateOarSet, deleteOarSet, isCreating: oarCreating, isUpdating: oarUpdating } = useOarSets();

  // Auth
  const authStore = useV2Auth();
  const user = authStore((state) => state.user);
  const canEdit = user?.activeTeamRole === 'COACH' || user?.activeTeamRole === 'OWNER';

  // Shell handlers
  const handleShellSubmit = (data: any) => {
    if (editingShell) {
      updateShell({ id: editingShell.id, ...data }, {
        onSuccess: () => {
          setIsShellModalOpen(false);
          setEditingShell(null);
        },
      });
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
      updateOarSet({ id: editingOarSet.id, ...data }, {
        onSuccess: () => {
          setIsOarModalOpen(false);
          setEditingOarSet(null);
        },
      });
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-txt-primary">Fleet Management</h1>
        {canEdit && (
          <button
            onClick={() => activeTab === 'shells' ? setIsShellModalOpen(true) : setIsOarModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            <Plus size={18} />
            Add {activeTab === 'shells' ? 'Shell' : 'Oar Set'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-6 bg-surface rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('shells')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'shells' ? 'bg-accent-primary text-white' : 'text-txt-secondary hover:text-txt-primary'
          }`}
        >
          Shells ({shells?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('oars')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'oars' ? 'bg-accent-primary text-white' : 'text-txt-secondary hover:text-txt-primary'
          }`}
        >
          Oars ({oarSets?.length || 0})
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-bdr-primary bg-card-bg p-4">
        {activeTab === 'shells' ? (
          shellsLoading ? (
            <div className="animate-pulse h-48 bg-surface rounded" />
          ) : (
            <ShellsTable
              shells={shells || []}
              canEdit={canEdit}
              onEdit={handleEditShell}
              onDelete={handleDeleteShell}
            />
          )
        ) : (
          oarsLoading ? (
            <div className="animate-pulse h-48 bg-surface rounded" />
          ) : (
            <OarsTable
              oarSets={oarSets || []}
              canEdit={canEdit}
              onEdit={handleEditOarSet}
              onDelete={handleDeleteOarSet}
            />
          )
        )}
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
