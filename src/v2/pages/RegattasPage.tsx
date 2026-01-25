import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import {
  RegattaList,
  RegattaCalendar,
  RegattaForm,
  RegattaDetail,
} from '../components/regatta';
import {
  useRegattas,
  useRegatta,
  useCreateRegatta,
  useUpdateRegatta,
  useDeleteRegatta,
  useDuplicateRegatta,
} from '../hooks/useRegattas';
import type { Regatta, RegattaFormData } from '../types/regatta';

type ViewMode = 'list' | 'calendar';

export function RegattasPage() {
  const navigate = useNavigate();
  const { regattaId } = useParams<{ regattaId?: string }>();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRegatta, setEditingRegatta] = useState<Regatta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Regatta | null>(null);

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
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          All Regattas
        </button>

        {loadingDetail ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-surface-elevated rounded-lg" />
            <div className="h-48 bg-surface-elevated rounded-lg" />
          </div>
        ) : selectedRegatta ? (
          <RegattaDetail
            regatta={selectedRegatta}
            onEdit={() => setEditingRegatta(selectedRegatta)}
          />
        ) : (
          <div className="text-center py-12 text-txt-secondary">
            Regatta not found
          </div>
        )}
      </div>
    );
  }

  // List/Calendar view
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-txt-primary">Regattas</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Manage races, results, and team rankings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-surface-elevated rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-surface-default text-txt-primary shadow-sm'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-surface-default text-txt-primary shadow-sm'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
              title="Calendar view"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Create button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                     bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover
                     transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Regatta
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RegattaList
              regattas={regattas || []}
              isLoading={loadingRegattas}
              onSelect={handleSelectRegatta}
              onEdit={setEditingRegatta}
              onDelete={setDeleteConfirm}
              onDuplicate={handleDuplicate}
            />
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RegattaCalendar
              regattas={regattas || []}
              onSelectRegatta={handleSelectRegatta}
              onSelectDate={() => {
                setIsFormOpen(true);
                // Could pre-fill date in form
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <Dialog
        open={isFormOpen || !!editingRegatta}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRegatta(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg bg-surface-default rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-txt-primary mb-4">
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
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-surface-default rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-txt-primary">
              Delete Regatta
            </Dialog.Title>
            <p className="mt-2 text-sm text-txt-secondary">
              Are you sure you want to delete "{deleteConfirm?.name}"? This will also delete
              all events, races, and results. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-txt-secondary
                         bg-surface-elevated rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRegatta.isPending}
                className="px-4 py-2 text-sm font-medium text-white
                         bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteRegatta.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default RegattasPage;
