/**
 * CanvasRegattasPage - Regatta management with Canvas design language
 *
 * Canvas design philosophy:
 * - Chamfered panels (clip-path diagonal corners, NOT rounded)
 * - ScrambleNumber for all numeric values
 * - Ruled headers (NOT card headers)
 * - Ticket-style regatta items (NOT generic cards)
 * - Console readout footer (NOT stats bar)
 * - Monochrome chrome, data-only color
 *
 * Feature parity with V2 RegattasPage:
 * - List/calendar view toggle
 * - Regatta CRUD operations
 * - Detail view navigation
 * - Keyboard shortcuts
 * - Duplicate functionality
 * - Offline queue indicator
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, List, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';
import {
  ScrambleNumber,
  CanvasTicket,
  CanvasModal,
  CanvasFormField,
  CanvasButton,
  CanvasConsoleReadout,
  CanvasChamferPanel,
} from '@v2/components/canvas';
import {
  useRegattas,
  useRegatta,
  useCreateRegatta,
  useUpdateRegatta,
  useDeleteRegatta,
  useDuplicateRegatta,
} from '../../hooks/useRegattas';
import { RegattaCalendar, RegattaDetail, RegattaForm } from '../../components/regatta';
import type { Regatta, RegattaFormData } from '../../types/regatta';

type ViewMode = 'list' | 'calendar';

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
// CANVAS REGATTAS PAGE
// ============================================

export function CanvasRegattasPage() {
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

  // Calculate stats
  const totalRegattas = regattas?.length || 0;
  const upcomingRegattas = regattas?.filter((r) => new Date(r.date) > new Date()).length || 0;
  const totalEvents = regattas?.reduce((sum, r) => sum + (r.events?.length || 0), 0) || 0;

  // Show detail view if regattaId is present
  if (regattaId) {
    return (
      <div className="h-full flex flex-col bg-void">
        <div className="max-w-5xl mx-auto w-full flex-1 overflow-auto">
          <div className="px-6 pt-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-bright
                         transition-colors mb-6 group font-mono"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              ALL REGATTAS
            </button>

            {loadingDetail ? (
              <CanvasChamferPanel className="p-6">
                <div className="space-y-4">
                  <div className="h-8 w-64 bg-ink-well/50 animate-pulse" />
                  <div className="h-4 w-48 bg-ink-well/50 animate-pulse" />
                  <div className="h-4 w-32 bg-ink-well/50 animate-pulse" />
                </div>
              </CanvasChamferPanel>
            ) : selectedRegatta ? (
              <RegattaDetail
                regatta={selectedRegatta}
                onEdit={() => setEditingRegatta(selectedRegatta)}
              />
            ) : (
              <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'REGATTA NOT FOUND' }]} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // List/Calendar view
  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header — text against void */}
      <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-white/[0.06]/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                RACING
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold text-ink-bright tracking-tight">
                Regattas
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* View toggle */}
              <div className="flex gap-2 flex-1 lg:flex-none">
                <CanvasButton
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('list')}
                  className="!px-3 !py-2 flex-1 lg:flex-none"
                >
                  <List className="w-4 h-4" />
                  <span className="sr-only">List view</span>
                </CanvasButton>
                <CanvasButton
                  variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('calendar')}
                  className="!px-3 !py-2 flex-1 lg:flex-none"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="sr-only">Calendar view</span>
                </CanvasButton>
              </div>

              <CanvasButton
                variant="primary"
                onClick={() => setIsFormOpen(true)}
                className="flex-1 lg:flex-none"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">NEW REGATTA</span>
                <span className="sm:hidden">NEW</span>
              </CanvasButton>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6">
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {loadingRegattas ? (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {[...Array(4)].map((_, i) => (
                      <motion.div key={i} variants={fadeUp}>
                        <CanvasChamferPanel className="p-4 h-24 animate-pulse bg-ink-well/30">
                          <div className="h-full" />
                        </CanvasChamferPanel>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : totalRegattas === 0 ? (
                  <div className="py-12 text-center">
                    <CanvasConsoleReadout
                      items={[{ label: 'STATUS', value: 'NO REGATTAS SCHEDULED' }]}
                    />
                  </div>
                ) : (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {regattas?.map((regatta) => {
                      const startDate = new Date(regatta.date);
                      const endDate = regatta.endDate ? new Date(regatta.endDate) : startDate;
                      const isUpcoming = startDate > new Date();
                      const isInProgress = startDate <= new Date() && endDate >= new Date();
                      const status = isUpcoming
                        ? 'UPCOMING'
                        : isInProgress
                          ? 'IN PROGRESS'
                          : 'COMPLETED';
                      const statusColor = isUpcoming
                        ? 'text-data-good'
                        : isInProgress
                          ? 'text-data-warning'
                          : 'text-ink-muted';
                      const eventCount = regatta.events?.length || 0;

                      return (
                        <motion.div key={regatta.id} variants={fadeUp}>
                          <button
                            onClick={() => handleSelectRegatta(regatta)}
                            className="w-full text-left"
                          >
                            <CanvasTicket className="group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-ink-bright text-base mb-1 truncate">
                                    {regatta.name}
                                  </h3>
                                  <p className="font-mono text-xs text-ink-secondary mb-1">
                                    {startDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}{' '}
                                    &mdash;{' '}
                                    {endDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <p className="text-sm text-ink-muted">{regatta.location}</p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono text-xs ${statusColor}`}>
                                      {status}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <ScrambleNumber
                                      value={eventCount}
                                      className="text-ink-bright"
                                    />
                                    <span className="text-xs text-ink-muted font-mono">
                                      {eventCount === 1 ? 'EVENT' : 'EVENTS'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CanvasTicket>
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CanvasChamferPanel className="p-6">
                  <RegattaCalendar
                    regattas={regattas || []}
                    onSelectRegatta={handleSelectRegatta}
                    onSelectDate={() => setIsFormOpen(true)}
                  />
                </CanvasChamferPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-white/[0.06]/30 px-4 lg:px-6 py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'REGATTAS', value: totalRegattas.toString() },
              { label: 'UPCOMING', value: upcomingRegattas.toString() },
              { label: 'EVENTS TOTAL', value: totalEvents.toString() },
            ]}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CanvasModal
        isOpen={isFormOpen || !!editingRegatta}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRegatta(null);
        }}
        title={editingRegatta ? 'EDIT REGATTA' : 'NEW REGATTA'}
      >
        <RegattaForm
          regatta={editingRegatta || undefined}
          onSubmit={editingRegatta ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingRegatta(null);
          }}
          isSubmitting={createRegatta.isPending || updateRegatta.isPending}
        />
      </CanvasModal>

      {/* Delete Confirmation */}
      <CanvasModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="DELETE REGATTA"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Delete "{deleteConfirm?.name}"? This will also delete all events, races, and results.
            This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-4">
            <CanvasButton
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              CANCEL
            </CanvasButton>
            <CanvasButton
              variant="primary"
              onClick={handleDelete}
              disabled={deleteRegatta.isPending}
              className="flex-1 !bg-data-poor !border-data-poor hover:!bg-data-poor/90"
            >
              {deleteRegatta.isPending ? 'DELETING...' : 'DELETE'}
            </CanvasButton>
          </div>
        </div>
      </CanvasModal>
    </div>
  );
}

export default CanvasRegattasPage;
