/**
 * RecruitingPage: main recruiting view with status filter tabs and CRUD.
 *
 * Displays recruit visits as a filterable list with tabs for status.
 * Create/edit uses inline modal (dialog). Read-only hides mutations.
 * Uses usePermissions() for role-based access.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn, scaleIn } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { usePermissions } from '@/features/permissions';

import { recruitVisitsOptions, recruitKeys, createVisit, updateVisit, deleteVisit } from '../api';
import type { RecruitVisit, VisitStatus, CreateVisitInput, UpdateVisitInput } from '../types';
import { VisitCard } from './VisitCard';
import { VisitForm } from './VisitForm';
import { IconGraduationCap, IconUserPlus, IconX } from '@/components/icons';

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

type TabValue = 'all' | VisitStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Modal modes
// ---------------------------------------------------------------------------

type ModalMode = { type: 'create' } | { type: 'edit'; visit: RecruitVisit } | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecruitingPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedVisit, setSelectedVisit] = useState<RecruitVisit | null>(null);

  const { isReadOnly: isReadOnlyFn } = usePermissions();
  const readOnly = isReadOnlyFn('recruiting');

  const queryClient = useQueryClient();

  // Fetch all visits (filter client-side for simplicity)
  const { data, isLoading, error, refetch } = useQuery(recruitVisitsOptions());

  const visits = data?.visits ?? [];
  const filteredVisits =
    activeTab === 'all' ? visits : visits.filter((v) => v.status === activeTab);

  // Mutations
  const createMut = useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruitKeys.all });
      setModal(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; input: UpdateVisitInput }) => updateVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruitKeys.all });
      setModal(null);
      setSelectedVisit(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruitKeys.all });
      setSelectedVisit(null);
    },
  });

  const handleCreate = useCallback(
    async (data: CreateVisitInput) => {
      await createMut.mutateAsync(data);
    },
    [createMut]
  );

  const handleUpdate = useCallback(
    async (data: CreateVisitInput & { status?: VisitStatus }) => {
      if (!modal || modal.type !== 'edit') return;
      await updateMut.mutateAsync({ id: modal.visit.id, input: data });
    },
    [modal, updateMut]
  );

  const handleDelete = useCallback(
    async (visit: RecruitVisit) => {
      if (!confirm(`Delete visit for ${visit.recruitName}?`)) return;
      await deleteMut.mutateAsync(visit.id);
    },
    [deleteMut]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-semibold text-text-bright">Recruiting</h1>
          <p className="text-sm text-text-dim mt-0.5">
            Track recruit visits and schedule campus tours
          </p>
        </div>
        <div className="flex items-center gap-2">
          {readOnly && <ReadOnlyBadge />}
          {!readOnly && (
            <Button size="sm" onClick={() => setModal({ type: 'create' })}>
              <IconUserPlus className="h-4 w-4" aria-hidden="true" />
              New Visit
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-void-deep rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150
              ${
                activeTab === tab.value
                  ? 'bg-void-raised text-text-bright shadow-sm'
                  : 'text-text-dim hover:text-text-bright'
              }
            `.trim()}
          >
            {tab.label}
            {!isLoading && tab.value !== 'all' && (
              <span className="ml-1.5 text-xs text-text-faint">
                {visits.filter((v) => v.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonGroup className="gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="5rem" rounded="lg" />
          ))}
        </SkeletonGroup>
      ) : error ? (
        <div className="flex justify-center py-12">
          <ErrorState
            title="Failed to load recruits"
            message="Could not fetch recruiting data. Please try again."
            onRetry={() => refetch()}
          />
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="py-16">
          <EmptyState
            icon={IconGraduationCap}
            title={activeTab === 'all' ? 'No recruit visits yet' : `No ${activeTab} visits`}
            description={
              activeTab === 'all'
                ? 'Create your first recruit visit to start tracking campus tours.'
                : `No visits with ${activeTab} status.`
            }
            action={
              !readOnly && activeTab === 'all'
                ? { label: 'New Visit', onClick: () => setModal({ type: 'create' }) }
                : undefined
            }
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid gap-3"
        >
          {filteredVisits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} onClick={() => setSelectedVisit(visit)} />
          ))}
        </motion.div>
      )}

      {/* Detail panel (selected visit) */}
      <AnimatePresence>
        {selectedVisit && !modal && (
          <motion.div
            key="detail"
            {...scaleIn}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <div className="panel rounded-2xl shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-display font-semibold text-text-bright">
                      {selectedVisit.recruitName}
                    </h2>
                    <p className="text-sm text-text-dim">
                      {selectedVisit.date?.split('T')[0]} {selectedVisit.startTime}
                      {' - '}
                      {selectedVisit.endTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVisit(null)}
                    className="text-text-faint hover:text-text-bright transition-colors p-1"
                    aria-label="Close detail panel"
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>

                {/* Fields */}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {selectedVisit.recruitEmail && (
                    <div>
                      <dt className="text-text-faint text-xs">Email</dt>
                      <dd className="text-text-bright">{selectedVisit.recruitEmail}</dd>
                    </div>
                  )}
                  {selectedVisit.recruitPhone && (
                    <div>
                      <dt className="text-text-faint text-xs">Phone</dt>
                      <dd className="text-text-bright">{selectedVisit.recruitPhone}</dd>
                    </div>
                  )}
                  {selectedVisit.recruitSchool && (
                    <div>
                      <dt className="text-text-faint text-xs">School</dt>
                      <dd className="text-text-bright">{selectedVisit.recruitSchool}</dd>
                    </div>
                  )}
                  {selectedVisit.recruitGradYear && (
                    <div>
                      <dt className="text-text-faint text-xs">Grad Year</dt>
                      <dd className="text-text-bright">{selectedVisit.recruitGradYear}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-faint text-xs">Status</dt>
                    <dd className="text-text-bright capitalize">{selectedVisit.status}</dd>
                  </div>
                </dl>

                {/* Notes */}
                {selectedVisit.notes && (
                  <div>
                    <h4 className="text-xs font-display text-text-faint mb-1">Notes</h4>
                    <p className="text-sm text-text-default whitespace-pre-wrap">
                      {selectedVisit.notes}
                    </p>
                  </div>
                )}

                {/* Actions (coach only) */}
                {!readOnly && (
                  <div className="flex items-center gap-2 pt-3 border-t border-edge-default">
                    <Button
                      size="sm"
                      onClick={() => {
                        setModal({ type: 'edit', visit: selectedVisit });
                      }}
                    >
                      Edit Visit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(selectedVisit)}
                      className="text-data-poor hover:text-data-poor"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            key="form-modal"
            {...scaleIn}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <div className="panel rounded-2xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-display font-semibold text-text-bright">
                    {modal.type === 'create' ? 'New Recruit Visit' : 'Edit Visit'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="text-text-faint hover:text-text-bright transition-colors p-1"
                    aria-label="Close form"
                  >
                    <IconX className="h-5 w-5" />
                  </button>
                </div>
                <VisitForm
                  visit={modal.type === 'edit' ? modal.visit : undefined}
                  onSubmit={modal.type === 'create' ? handleCreate : handleUpdate}
                  onCancel={() => setModal(null)}
                  isPending={createMut.isPending || updateMut.isPending}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
