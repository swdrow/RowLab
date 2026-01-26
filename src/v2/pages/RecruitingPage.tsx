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
 * - Violet theme consistent with recruiting feature
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
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              Recruiting
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Manage recruit visits and schedules
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition"
          >
            <Plus className="w-4 h-4" />
            New Visit
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-[var(--color-text-secondary)]" />
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === status
                  ? 'bg-violet-500 text-white'
                  : 'bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Visit List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-40 bg-[var(--color-bg-surface-elevated)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-surface-elevated)] rounded-xl">
            <Users className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              No recruit visits
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              {statusFilter !== 'all'
                ? `No ${statusFilter} visits found`
                : 'Create your first recruit visit to get started'}
            </p>
            {statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition"
              >
                <Plus className="w-4 h-4" />
                Create Visit
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visits.map(visit => (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RecruitVisitCard
                  visit={visit}
                  onClick={() => setSelectedVisitId(visit.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Form Modal */}
        <Modal open={showForm} onClose={() => setShowForm(false)} title="New Recruit Visit" size="lg">
          <RecruitVisitForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowForm(false)}
          />
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
