import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Filter } from 'lucide-react';
import { useRecruitVisits } from '@v2/hooks/useRecruitVisits';
import { FeatureGuard } from '@v2/components/common';
import { RecruitVisitCard, RecruitVisitForm, VisitDetailPanel } from '@v2/components/recruiting';
import { Modal } from '@v2/components/ui/Modal';
import type { VisitStatus } from '@v2/types/recruiting';

/**
 * RecruitingPage - Main recruiting management page
 *
 * Features:
 * - List all recruit visits with status filtering
 * - Create new visits via modal form
 * - View visit details in slide-out panel
 * - Edit visits via modal form
 * - Status filters: All, Scheduled, Completed, Cancelled
 * - Empty state when no visits
 * - Copper editorial design theme
 */
export function RecruitingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');

  // Get visit ID from URL params (for direct links from widget)
  useEffect(() => {
    const visitId = searchParams.get('visit');
    if (visitId) {
      setSelectedVisitId(visitId);
    }
  }, [searchParams]);

  const { visits, isLoading } = useRecruitVisits(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
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
    // Clear URL param
    if (searchParams.has('visit')) {
      searchParams.delete('visit');
      setSearchParams(searchParams);
    }
  };

  return (
    <FeatureGuard featureId="recruiting">
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
                RECRUIT MANAGEMENT
              </p>
              <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
                Recruiting
              </h1>
              <p className="text-sm text-ink-secondary mt-2">Manage recruit visits and schedules</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                New Visit
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-secondary" />
            {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                  statusFilter === status
                    ? 'bg-accent-copper/10 text-accent-copper border-accent-copper/20'
                    : 'bg-ink-raised text-ink-secondary hover:text-ink-body border-ink-border hover:border-accent-copper/20'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Visit List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-ink-raised rounded-xl border border-ink-border animate-pulse"
                />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12 bg-ink-raised rounded-xl border border-ink-border">
              <Users className="w-12 h-12 text-accent-copper/30 mx-auto mb-4" />
              <h3 className="text-lg font-display font-medium text-ink-bright mb-2">
                No recruit visits
              </h3>
              <p className="text-ink-secondary mb-4">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} visits found`
                  : 'Create your first recruit visit to get started'}
              </p>
              {statusFilter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-all duration-150"
                >
                  <Plus className="w-4 h-4" />
                  Create Visit
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visits.map((visit) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <RecruitVisitCard visit={visit} onClick={() => setSelectedVisitId(visit.id)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="New Recruit Visit"
          size="lg"
        >
          <RecruitVisitForm onSuccess={handleCreateSuccess} onCancel={() => setShowForm(false)} />
        </Modal>

        {/* Edit Form Modal */}
        <Modal
          open={!!editingVisitId}
          onClose={() => setEditingVisitId(null)}
          title="Edit Recruit Visit"
          size="lg"
        >
          {editingVisitId && (
            <RecruitVisitForm
              visitId={editingVisitId}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingVisitId(null)}
            />
          )}
        </Modal>

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
    </FeatureGuard>
  );
}

export default RecruitingPage;
