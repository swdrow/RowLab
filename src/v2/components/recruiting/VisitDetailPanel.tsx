import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Mail, Phone, School, Share2, FileText, Edit, Trash2 } from 'lucide-react';
import { useRecruitVisit, useDeleteRecruitVisit, useGenerateShareToken } from '@v2/hooks/useRecruitVisits';
import { RichTextDisplay, toast } from '@v2/components/common';
import { useState } from 'react';

interface VisitDetailPanelProps {
  visitId: string | null;
  onClose: () => void;
  onEdit?: (visitId: string) => void;
}

/**
 * VisitDetailPanel - Slide-out panel showing full recruit visit details
 *
 * Features:
 * - AnimatePresence with backdrop
 * - Full recruit information display
 * - Visit time, host athlete, schedule
 * - Actions: Edit, Share (copy link), Delete with confirmation
 * - Spring animation for smooth slide-in from right
 */
export function VisitDetailPanel({ visitId, onClose, onEdit }: VisitDetailPanelProps) {
  const { visit, isLoading } = useRecruitVisit(visitId);
  const deleteVisit = useDeleteRecruitVisit();
  const generateToken = useGenerateShareToken();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleDelete = async () => {
    if (!visitId) return;
    try {
      await deleteVisit.deleteVisitAsync(visitId);
      toast.success('Visit deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete visit');
    }
  };

  const handleShare = async () => {
    if (!visitId) return;
    setIsSharing(true);
    try {
      const shareToken = await generateToken.generateTokenAsync(visitId);
      const shareUrl = `${window.location.origin}/visit/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error) {
      toast.error('Failed to generate share link');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {visitId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-[var(--color-bg-surface-base)] z-50 shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--color-bg-surface-base)] border-b border-[var(--color-border-default)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Visit Details
              </h2>
              <div className="flex items-center gap-2">
                {onEdit && visit && (
                  <button
                    onClick={() => onEdit(visitId)}
                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition"
                    title="Edit visit"
                  >
                    <Edit className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  </button>
                )}
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition disabled:opacity-50"
                  title="Copy share link"
                >
                  <Share2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition"
                >
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-[var(--color-bg-surface-elevated)] rounded w-2/3" />
                  <div className="h-4 bg-[var(--color-bg-surface-elevated)] rounded w-1/2" />
                  <div className="h-24 bg-[var(--color-bg-surface-elevated)] rounded" />
                </div>
              </div>
            ) : visit ? (
              <div className="p-6 space-y-6">
                {/* Recruit Info */}
                <section>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                    {visit.recruitName}
                  </h3>
                  <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                    {visit.recruitEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a
                          href={`mailto:${visit.recruitEmail}`}
                          className="hover:text-[var(--color-interactive-primary)]"
                        >
                          {visit.recruitEmail}
                        </a>
                      </div>
                    )}
                    {visit.recruitPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{visit.recruitPhone}</span>
                      </div>
                    )}
                    {visit.recruitSchool && (
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        <span>
                          {visit.recruitSchool}
                          {visit.recruitGradYear && ` (${visit.recruitGradYear})`}
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Visit Time */}
                <section className="bg-violet-500/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-violet-500 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(visit.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Clock className="w-4 h-4" />
                    <span>
                      {visit.startTime} - {visit.endTime}
                    </span>
                  </div>
                </section>

                {/* Status Badge */}
                <section>
                  <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Status
                  </h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      visit.status === 'scheduled'
                        ? 'bg-blue-500/10 text-blue-500'
                        : visit.status === 'completed'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </span>
                </section>

                {/* Host Athlete */}
                {visit.hostAthlete && (
                  <section>
                    <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Host Athlete
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-surface-elevated)] rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {visit.hostAthlete.firstName} {visit.hostAthlete.lastName}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Assigned host
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Schedule */}
                {(visit.scheduleContent || visit.schedulePdfUrl) && (
                  <section>
                    <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Visit Schedule
                    </h4>
                    {visit.scheduleType === 'richtext' && visit.scheduleContent ? (
                      <div className="prose prose-sm max-w-none p-4 bg-[var(--color-bg-surface-elevated)] rounded-lg">
                        <RichTextDisplay content={visit.scheduleContent} />
                      </div>
                    ) : visit.schedulePdfUrl ? (
                      <a
                        href={visit.schedulePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-4 bg-[var(--color-bg-surface-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition"
                      >
                        <FileText className="w-8 h-8 text-[var(--color-interactive-primary)]" />
                        <span className="text-[var(--color-interactive-primary)]">
                          View Schedule PDF
                        </span>
                      </a>
                    ) : null}
                  </section>
                )}

                {/* Notes */}
                {visit.notes && (
                  <section>
                    <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      Internal Notes
                    </h4>
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {visit.notes}
                    </p>
                  </section>
                )}

                {/* Delete action */}
                <div className="pt-4 border-t border-[var(--color-border-default)]">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--color-status-error)]">
                        Delete this visit?
                      </span>
                      <button
                        onClick={handleDelete}
                        disabled={deleteVisit.isDeleting}
                        className="px-3 py-1 bg-[var(--color-status-error)] text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                      >
                        {deleteVisit.isDeleting ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-[var(--color-status-error)] hover:underline text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete visit
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-[var(--color-text-secondary)]">Visit not found</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
