/**
 * CanvasRecruitingPage - Recruit visit tracking with Canvas design language
 *
 * Canvas design philosophy:
 * - CanvasTabs for status filtering (All/Scheduled/Completed/Cancelled)
 * - CanvasTicket per visit
 * - CanvasModal for create/edit forms
 * - CanvasButton for actions
 * - CanvasConsoleReadout at bottom
 * - Feature guard for recruiting feature gate
 * - NO rounded corners, NO card wrappers
 *
 * Feature parity with V2 RecruitingPage:
 * - List all recruit visits with status filtering
 * - Create new visits via modal form
 * - View visit details in slide-out panel
 * - Edit visits via modal form
 * - Empty state
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import {
  CanvasTabs,
  CanvasButton,
  CanvasModal,
  CanvasConsoleReadout,
  CanvasTicket,
} from '@v2/components/canvas';
import { useRecruitVisits } from '@v2/hooks/useRecruitVisits';
import { RecruitVisitForm, VisitDetailPanel } from '@v2/components/recruiting';
import type { VisitStatus } from '@v2/types/recruiting';

type FilterTab = 'all' | 'scheduled' | 'completed' | 'cancelled';

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
// CANVAS RECRUITING PAGE
// ============================================

export function CanvasRecruitingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Get visit ID from URL params (for direct links from widget)
  useEffect(() => {
    const visitId = searchParams.get('visit');
    if (visitId) {
      setSelectedVisitId(visitId);
    }
  }, [searchParams]);

  const statusFilter: VisitStatus | undefined =
    activeFilter !== 'all' ? (activeFilter as VisitStatus) : undefined;
  const { visits, isLoading } = useRecruitVisits(
    statusFilter ? { status: statusFilter } : undefined
  );

  const handleCreateSuccess = () => {
    setShowForm(false);
  };

  const handleEditSuccess = () => {
    setEditingVisitId(null);
    setSelectedVisitId(null);
  };

  const handleClosePanel = () => {
    setSelectedVisitId(null);
    if (searchParams.has('visit')) {
      searchParams.delete('visit');
      setSearchParams(searchParams);
    }
  };

  // Stats
  const totalVisits = visits.length;
  const scheduledCount = visits.filter((v) => v.status === 'scheduled').length;
  const completedCount = visits.filter((v) => v.status === 'completed').length;

  const filterTabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'scheduled' as const, label: 'Scheduled' },
    { id: 'completed' as const, label: 'Completed' },
    { id: 'cancelled' as const, label: 'Cancelled' },
  ];

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header */}
      <div className="px-4 lg:px-6 pt-6 lg:pt-8 pb-4 lg:pb-6 border-b border-ink-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                TEAM / RECRUITING
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink-bright tracking-tight">
                Recruiting
              </h1>
            </div>

            <CanvasButton
              variant="primary"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              NEW VISIT
            </CanvasButton>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <CanvasTabs
              tabs={filterTabs}
              activeTab={activeFilter}
              onChange={(id) => setActiveFilter(id as FilterTab)}
            />
          </div>

          <div className="mt-4 lg:mt-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <div className="h-24 bg-ink-well/30 animate-pulse border border-white/[0.04]" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : totalVisits === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center"
                >
                  <Users className="w-12 h-12 text-ink-muted/30 mx-auto mb-4" />
                  <p className="font-mono text-sm text-ink-muted mb-1">
                    {activeFilter !== 'all'
                      ? `[NO ${activeFilter.toUpperCase()} VISITS]`
                      : '[NO RECRUIT VISITS]'}
                  </p>
                  <p className="text-xs text-ink-muted mb-4">
                    {activeFilter === 'all'
                      ? 'Create your first recruit visit to get started'
                      : `No ${activeFilter} visits found`}
                  </p>
                  {activeFilter === 'all' && (
                    <CanvasButton variant="primary" onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4" />
                      CREATE VISIT
                    </CanvasButton>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {visits.map((visit) => (
                    <motion.div key={visit.id} variants={fadeUp}>
                      <button
                        onClick={() => setSelectedVisitId(visit.id)}
                        className="w-full text-left"
                      >
                        <CanvasTicket className="group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-ink-bright text-base mb-1 truncate">
                                {visit.recruitName}
                              </h3>
                              <p className="font-mono text-xs text-ink-secondary mb-1">
                                {new Date(visit.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                              {visit.notes && (
                                <p className="text-sm text-ink-muted line-clamp-1">{visit.notes}</p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`font-mono text-xs ${
                                  visit.status === 'scheduled'
                                    ? 'text-data-good'
                                    : visit.status === 'completed'
                                      ? 'text-ink-muted'
                                      : 'text-data-poor'
                                }`}
                              >
                                {visit.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </CanvasTicket>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-ink-border/30 px-4 lg:px-6 py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'TOTAL VISITS', value: totalVisits.toString() },
              { label: 'SCHEDULED', value: scheduledCount.toString() },
              { label: 'COMPLETED', value: completedCount.toString() },
            ]}
          />
        </div>
      </div>

      {/* Create Form Modal */}
      <CanvasModal isOpen={showForm} onClose={() => setShowForm(false)} title="NEW RECRUIT VISIT">
        <RecruitVisitForm onSuccess={handleCreateSuccess} onCancel={() => setShowForm(false)} />
      </CanvasModal>

      {/* Edit Form Modal */}
      <CanvasModal
        isOpen={!!editingVisitId}
        onClose={() => setEditingVisitId(null)}
        title="EDIT RECRUIT VISIT"
      >
        {editingVisitId && (
          <RecruitVisitForm
            visit={visits.find((v) => v.id === editingVisitId)}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingVisitId(null)}
          />
        )}
      </CanvasModal>

      {/* Detail Panel */}
      <VisitDetailPanel
        visitId={selectedVisitId}
        onClose={handleClosePanel}
        onEdit={(id) => {
          setSelectedVisitId(null);
          setEditingVisitId(id);
        }}
      />
    </div>
  );
}

export default CanvasRecruitingPage;
