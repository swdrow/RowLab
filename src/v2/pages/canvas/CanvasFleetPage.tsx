/**
 * CanvasFleetPage - Fleet management with Canvas design language
 *
 * Canvas design philosophy:
 * - CanvasTabs for Shells/Oars switching
 * - CanvasDataTable for equipment listing
 * - CanvasModal + CanvasFormField for create/edit
 * - CanvasButton for actions
 * - CanvasConsoleReadout for equipment stats
 * - NO rounded corners, NO card wrappers
 *
 * Feature parity with V2 CoachFleet:
 * - Shells/Oars tab toggle
 * - CRUD for shells and oar sets
 * - Role-based edit access
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  CanvasTabs,
  CanvasButton,
  CanvasModal,
  CanvasConsoleReadout,
  CanvasChamferPanel,
} from '@v2/components/canvas';
import { useShells } from '@v2/hooks/useShells';
import { useOarSets } from '@v2/hooks/useOarSets';
import { ShellsTable, OarsTable, ShellForm, OarSetForm } from '@v2/components/fleet';
import { useAuth } from '@v2/contexts/AuthContext';
import type { Shell, OarSet } from '@v2/types/coach';

type FleetTab = 'shells' | 'oars';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS FLEET PAGE
// ============================================

export function CanvasFleetPage() {
  const [activeTab, setActiveTab] = useState<FleetTab>('shells');
  const [isShellModalOpen, setIsShellModalOpen] = useState(false);
  const [editingShell, setEditingShell] = useState<Shell | null>(null);
  const [isOarModalOpen, setIsOarModalOpen] = useState(false);
  const [editingOarSet, setEditingOarSet] = useState<OarSet | null>(null);

  // Data hooks
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

  // Oar set handlers
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

  const handleAdd = () => {
    if (activeTab === 'shells') {
      setIsShellModalOpen(true);
    } else {
      setIsOarModalOpen(true);
    }
  };

  // Stats
  const shellCount = shells?.length || 0;
  const oarCount = oarSets?.length || 0;

  const tabs = [
    { id: 'shells' as const, label: `Shells` },
    { id: 'oars' as const, label: `Oars` },
  ];

  const isLoading = activeTab === 'shells' ? shellsLoading : oarsLoading;

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header */}
      <div className="px-4 lg:px-6 pt-4 lg:pt-8 pb-4 lg:pb-6 border-b border-white/[0.06]/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                TEAM / FLEET
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold text-ink-bright tracking-tight">
                Fleet
              </h1>
            </div>

            {canEdit && (
              <CanvasButton
                variant="primary"
                onClick={handleAdd}
                className="min-h-[44px] text-sm lg:text-base w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                ADD {activeTab === 'shells' ? 'SHELL' : 'OAR SET'}
              </CanvasButton>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <CanvasTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as FleetTab)}
          />

          <motion.div className="mt-6" variants={stagger} initial="hidden" animate="visible">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <CanvasChamferPanel className="p-4 h-16 animate-pulse bg-ink-well/30">
                      <div className="h-full" />
                    </CanvasChamferPanel>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div variants={fadeUp}>
                <div className="bg-ink-raised border border-white/[0.04]">
                  {activeTab === 'shells' ? (
                    <ShellsTable
                      shells={shells || []}
                      canEdit={canEdit}
                      onEdit={handleEditShell}
                      onDelete={handleDeleteShell}
                    />
                  ) : (
                    <OarsTable
                      oarSets={oarSets || []}
                      canEdit={canEdit}
                      onEdit={handleEditOarSet}
                      onDelete={handleDeleteOarSet}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-white/[0.06]/30 px-4 lg:px-6 py-2 lg:py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'SHELLS', value: shellCount.toString() },
              { label: 'OAR SETS', value: oarCount.toString() },
              { label: 'TOTAL EQUIPMENT', value: (shellCount + oarCount).toString() },
            ]}
          />
        </div>
      </div>

      {/* Shell Modal */}
      <CanvasModal
        isOpen={isShellModalOpen}
        onClose={() => {
          setIsShellModalOpen(false);
          setEditingShell(null);
        }}
        title={editingShell ? 'EDIT SHELL' : 'ADD SHELL'}
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
      </CanvasModal>

      {/* Oar Set Modal */}
      <CanvasModal
        isOpen={isOarModalOpen}
        onClose={() => {
          setIsOarModalOpen(false);
          setEditingOarSet(null);
        }}
        title={editingOarSet ? 'EDIT OAR SET' : 'ADD OAR SET'}
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
      </CanvasModal>
    </div>
  );
}

export default CanvasFleetPage;
