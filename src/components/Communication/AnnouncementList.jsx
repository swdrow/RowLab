import { motion } from 'framer-motion';
import { Megaphone, CheckCheck, Filter } from 'lucide-react';
import AnnouncementCard from './AnnouncementCard';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'important', label: 'Important' },
  { key: 'urgent', label: 'Urgent' },
];

const filterColorConfig = {
  all: {
    active: 'bg-blade-blue/10 text-blade-blue border-blade-blue/30',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02] border-transparent',
  },
  unread: {
    active: 'bg-coxswain-violet/10 text-coxswain-violet border-coxswain-violet/30',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02] border-transparent',
  },
  important: {
    active: 'bg-warning-orange/10 text-warning-orange border-warning-orange/30',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02] border-transparent',
  },
  urgent: {
    active: 'bg-danger-red/10 text-danger-red border-danger-red/30',
    inactive: 'text-text-muted hover:text-text-secondary hover:bg-white/[0.02] border-transparent',
  },
};

/**
 * Loading skeleton for announcement cards
 */
function AnnouncementSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-void-elevated/50 border border-white/[0.06] animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-void-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-void-surface rounded w-3/4" />
          <div className="h-3 bg-void-surface rounded w-1/2" />
          <div className="h-3 bg-void-surface rounded w-full mt-3" />
          <div className="h-3 bg-void-surface rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ filter }) {
  const messages = {
    all: 'No announcements yet',
    unread: 'No unread announcements',
    important: 'No important announcements',
    urgent: 'No urgent announcements',
  };

  const descriptions = {
    all: 'When announcements are posted, they will appear here.',
    unread: 'You are all caught up!',
    important: 'No announcements have been marked as important.',
    urgent: 'No urgent announcements at this time.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
        <Megaphone className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-1">
        {messages[filter] || messages.all}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm">
        {descriptions[filter] || descriptions.all}
      </p>
    </motion.div>
  );
}

/**
 * AnnouncementList component displays a filterable list of announcements
 * Redesigned with Precision Instrument design system
 */
const AnnouncementList = ({
  announcements = [],
  loading = false,
  onAnnouncementClick,
  onEdit,
  onDelete,
  onTogglePin,
  canEdit = false,
  filter = 'all',
  onFilterChange,
  onMarkAllRead,
}) => {
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const filteredAnnouncements = announcements.filter((announcement) => {
    switch (filter) {
      case 'unread':
        return !announcement.isRead;
      case 'important':
        return announcement.priority === 'important';
      case 'urgent':
        return announcement.priority === 'urgent';
      default:
        return true;
    }
  });

  const getCounts = () => ({
    all: announcements.length,
    unread: announcements.filter((a) => !a.isRead).length,
    important: announcements.filter(
      (a) => a.priority === 'important'
    ).length,
    urgent: announcements.filter((a) => a.priority === 'urgent')
      .length,
  });

  const counts = getCounts();

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 text-sm text-text-muted mr-2">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter:</span>
        </div>
        {FILTER_OPTIONS.map((f) => {
          const colorConfig = filterColorConfig[f.key];
          const isActive = filter === f.key;

          return (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilterChange?.(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-150 ease-out ${
                isActive ? colorConfig.active : colorConfig.inactive
              }`}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-white/10' : 'bg-void-surface'
                }`}>
                  {counts[f.key]}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mark all read button */}
      {unreadCount > 0 && !loading && (
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMarkAllRead}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-text-secondary hover:text-text-primary bg-void-elevated/50 hover:bg-void-elevated border border-white/[0.06] transition-all duration-200"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </motion.button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && (
          <>
            <AnnouncementSkeleton />
            <AnnouncementSkeleton />
            <AnnouncementSkeleton />
          </>
        )}

        {!loading && filteredAnnouncements.length === 0 && (
          <EmptyState filter={filter} />
        )}

        {!loading &&
          filteredAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <AnnouncementCard
                announcement={announcement}
                onClick={() => onAnnouncementClick?.(announcement)}
                onEdit={() => onEdit?.(announcement)}
                onDelete={() => onDelete?.(announcement)}
                onTogglePin={() => onTogglePin?.(announcement)}
                canEdit={canEdit}
              />
            </motion.div>
          ))}
      </div>
    </div>
  );
};

export default AnnouncementList;
