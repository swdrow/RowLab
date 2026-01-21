import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Pin } from 'lucide-react';

/**
 * Format date nicely
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Priority badge configuration
 */
const priorityConfig = {
  normal: { color: 'bg-text-muted/10 text-text-muted border-text-muted/20', label: 'Normal' },
  important: { color: 'bg-warning-orange/10 text-warning-orange border-warning-orange/20', label: 'Important' },
  urgent: { color: 'bg-danger-red/10 text-danger-red border-danger-red/20', label: 'Urgent' },
};

/**
 * Audience display mapping
 */
const audienceLabels = {
  all: null,
  coaches: 'Coaches only',
  athletes: 'Athletes only',
  owners: 'Owners only',
};

/**
 * AnnouncementDetail component
 * Redesigned with Precision Instrument design system
 */
const AnnouncementDetail = ({
  announcement,
  onClose,
  onEdit,
  onDelete,
  canEdit = false,
  asModal = true,
}) => {
  const {
    title,
    content,
    priority = 'normal',
    visibleTo = 'all',
    pinned,
    author,
    createdAt,
    updatedAt,
  } = announcement || {};

  useEffect(() => {
    if (!asModal) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [asModal, onClose]);

  useEffect(() => {
    if (!asModal) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [asModal]);

  if (!announcement) return null;

  const priorityBadge = priorityConfig[priority] || priorityConfig.normal;
  const audienceLabel = audienceLabels[visibleTo];
  const wasUpdated = updatedAt && createdAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime();

  const detailContent = (
    <div className="relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-0 right-0 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
        aria-label="Close announcement"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Title */}
      <h1 className="text-xl font-semibold text-text-primary pr-10 mb-4">
        {title}
      </h1>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4 flex-wrap">
        {author && <span className="font-medium">{author}</span>}
        {author && createdAt && <span className="text-text-muted">-</span>}
        {createdAt && <span>{formatDate(createdAt)}</span>}
        {wasUpdated && <span className="text-text-muted italic">(Updated)</span>}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${priorityBadge.color}`}>
          {priorityBadge.label}
        </span>
        {audienceLabel && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-coxswain-violet/10 text-coxswain-violet border border-coxswain-violet/20">
            {audienceLabel}
          </span>
        )}
        {pinned && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning-orange/10 text-warning-orange border border-warning-orange/20 flex items-center gap-1">
            <Pin className="w-3 h-3" />
            Pinned
          </span>
        )}
      </div>

      {/* Content */}
      <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/[0.06]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEdit?.(announcement)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-void-elevated/50 hover:bg-void-elevated text-text-secondary hover:text-text-primary border border-white/[0.06] transition-all duration-200"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDelete?.(announcement)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-red/10 hover:bg-danger-red/20 text-danger-red border border-danger-red/20 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </motion.button>
        </div>
      )}
    </div>
  );

  if (!asModal) {
    return (
      <div className="p-6 rounded-xl bg-void-elevated/50 border border-white/[0.06] backdrop-blur-xl"
        style={{
          backgroundImage: 'linear-gradient(rgba(12, 12, 14, 0.9), rgba(12, 12, 14, 0.9)), linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
          backgroundOrigin: 'padding-box, border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {detailContent}
      </div>
    );
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="announcement-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-void-elevated/95 backdrop-blur-2xl saturate-[180%] shadow-2xl"
          style={{
            backgroundImage: 'linear-gradient(rgba(12, 12, 14, 0.95), rgba(12, 12, 14, 0.95)), linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {detailContent}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AnnouncementDetail;
