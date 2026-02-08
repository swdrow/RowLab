import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Calendar as CalendarIcon, ChevronLeft, HelpCircle } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { RegattaList, RegattaCalendar, RegattaForm, RegattaDetail } from '../components/regatta';
import {
  useRegattas,
  useRegatta,
  useCreateRegatta,
  useUpdateRegatta,
  useDeleteRegatta,
  useDuplicateRegatta,
} from '../hooks/useRegattas';
import { useRegattaKeyboard, getRegattaShortcuts } from '../hooks/useRegattaKeyboard';
import {
  RegattaListSkeleton,
  RegattaDetailSkeleton,
} from '../features/regatta/components/RegattaSkeleton';
import { OfflineQueueIndicator } from '../features/regatta/components/OfflineQueueIndicator';
import { queryKeys } from '../lib/queryKeys';
import type { Regatta, RegattaFormData } from '../types/regatta';

type ViewMode = 'list' | 'calendar';

export function RegattasPage() {
  const navigate = useNavigate();
  const { regattaId } = useParams<{ regattaId?: string }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegatta, setEditingRegatta] = useState<Regatta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Regatta | null>(null);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useRegattaKeyboard({
    onNewRegatta: () => setIsFormOpen(true),
    onRefresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.regattas.all }),
    onEscape: () => {
      if (isFormOpen) setIsFormOpen(false);
      if (editingRegatta) setEditingRegatta(null);
      if (deleteConfirm) setDeleteConfirm(null);
    },
  });

  // Data fetching
  const { data: regattas, isLoading: loadingRegattas } = useRegattas();
  const { data: selectedRegatta, isLoading: loadingDetail } = useRegatta(regattaId);

  // Mutations
  const createRegatta = useCreateRegatta();
  const updateRegatta = useUpdateRegatta();
  const deleteRegatta = useDeleteRegatta();
  const duplicateRegatta = useDuplicateRegatta();

  // Handlers
  const handleSelectRegatta = (regatta: Regatta) => {
    navigate(`/app/regattas/${regatta.id}`);
  };

  const handleBack = () => {
    navigate('/app/regattas');
  };

  const handleCreate = (data: RegattaFormData) => {
    createRegatta.mutate(data, {
      onSuccess: (newRegatta) => {
        setIsFormOpen(false);
        navigate(`/app/regattas/${newRegatta.id}`);
      },
    });
  };

  const handleUpdate = (data: RegattaFormData) => {
    if (!editingRegatta) return;
    updateRegatta.mutate(
      { id: editingRegatta.id, updates: data },
      {
        onSuccess: () => {
          setEditingRegatta(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteRegatta.mutate(deleteConfirm.id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        if (regattaId === deleteConfirm.id) {
          navigate('/app/regattas');
        }
      },
    });
  };

  const handleDuplicate = (regatta: Regatta) => {
    const newName = `${regatta.name} (Copy)`;
    duplicateRegatta.mutate(
      { sourceId: regatta.id, newName },
      {
        onSuccess: (newRegatta) => {
          navigate(`/app/regattas/${newRegatta.id}`);
        },
      }
    );
  };

  // Show detail view if regattaId is present
  if (regattaId) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="px-6 pt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-accent-copper hover:text-accent-copper-hover
                       transition-colors mb-6 group font-medium"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Regattas
          </button>

          {loadingDetail ? (
            <RegattaDetailSkeleton />
          ) : selectedRegatta ? (
            <RegattaDetail
              regatta={selectedRegatta}
              onEdit={() => setEditingRegatta(selectedRegatta)}
            />
          ) : (
            <div className="text-center py-12 text-ink-secondary">Regatta not found</div>
          )}
        </div>
      </div>
    );
  }

  // List/Calendar view
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              Race Management
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Regattas
            </h1>
            <p className="text-sm text-ink-secondary mt-2">
              Manage races, results, and team rankings
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-xl p-1 bg-ink-well border border-ink-border">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-150 ${
                  viewMode === 'list'
                    ? 'bg-accent-copper/[0.12] text-accent-copper shadow-sm'
                    : 'text-ink-muted hover:text-ink-secondary'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all duration-150 ${
                  viewMode === 'calendar'
                    ? 'bg-accent-copper/[0.12] text-accent-copper shadow-sm'
                    : 'text-ink-muted hover:text-ink-secondary'
                }`}
                title="Calendar view"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Create button with glow */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                       bg-gradient-to-b from-accent-copper to-accent-copper-hover
                       text-white rounded-xl
                       shadow-glow-copper hover:shadow-glow-copper-lg
                       hover:-translate-y-px active:translate-y-0
                       transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              New Regatta
            </button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {loadingRegattas ? (
                <RegattaListSkeleton />
              ) : (
                <RegattaList
                  regattas={regattas || []}
                  isLoading={false}
                  onSelect={handleSelectRegatta}
                  onEdit={setEditingRegatta}
                  onDelete={setDeleteConfirm}
                  onDuplicate={handleDuplicate}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <RegattaCalendar
                regattas={regattas || []}
                onSelectRegatta={handleSelectRegatta}
                onSelectDate={() => {
                  setIsFormOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* end px-6 wrapper */}

      {/* Create/Edit Modal */}
      <Dialog
        open={isFormOpen || !!editingRegatta}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRegatta(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto
                                   bg-ink-raised border border-white/[0.08]"
          >
            <Dialog.Title className="text-lg font-display font-semibold text-ink-bright mb-4">
              {editingRegatta ? 'Edit Regatta' : 'New Regatta'}
            </Dialog.Title>
            <RegattaForm
              regatta={editingRegatta || undefined}
              onSubmit={editingRegatta ? handleUpdate : handleCreate}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingRegatta(null);
              }}
              isSubmitting={createRegatta.isPending || updateRegatta.isPending}
            />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-sm rounded-2xl shadow-2xl p-6
                                   bg-ink-raised border border-white/[0.08]"
          >
            <Dialog.Title className="text-lg font-display font-semibold text-ink-bright">
              Delete Regatta
            </Dialog.Title>
            <p className="mt-2 text-sm text-ink-secondary">
              Are you sure you want to delete "{deleteConfirm?.name}"? This will also delete all
              events, races, and results. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-ink-secondary
                         rounded-xl border border-white/[0.08] hover:bg-white/[0.04]
                         transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRegatta.isPending}
                className="px-4 py-2 text-sm font-medium text-white
                         bg-data-poor rounded-xl hover:bg-data-poor/90
                         shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]
                         disabled:opacity-50 transition-all"
              >
                {deleteRegatta.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-md rounded-2xl shadow-2xl p-6
                                   bg-ink-raised border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-ink-secondary" />
              <Dialog.Title className="text-lg font-display font-semibold text-ink-bright">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <div className="space-y-1">
              {getRegattaShortcuts({
                hasNewRegatta: true,
                hasRefresh: true,
                hasEscape: true,
              })
                .filter((s) => s.available)
                .map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="text-sm text-ink-body">{shortcut.description}</span>
                    <kbd className="px-2.5 py-1 text-xs font-mono bg-ink-deep text-ink-primary rounded-lg border border-white/[0.08]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-4 py-2.5 text-sm font-medium
                       bg-gradient-to-b from-accent-primary to-accent-primary/90
                       text-white rounded-xl shadow-glow-blue
                       hover:shadow-glow-blue-lg transition-all duration-150"
            >
              Got it
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Offline Queue Indicator */}
      <OfflineQueueIndicator />
    </div>
  );
}

export default RegattasPage;
