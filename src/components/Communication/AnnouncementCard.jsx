import { useState, useRef, useEffect } from 'react';
import { Pin, MoreVertical, Pencil, Trash2 } from 'lucide-react';

/**
 * Helper function to format relative time
 */
function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) return 'just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
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
  ALL: null,
  COACH: 'Coaches only',
  coaches: 'Coaches only',
  ATHLETE: 'Athletes only',
  athletes: 'Athletes only',
  OWNER: 'Owners only',
  owners: 'Owners only',
};

/**
 * AnnouncementCard component
 * Redesigned with Precision Instrument design system
 */
const AnnouncementCard = ({
  announcement,
  onClick,
  onEdit,
  onDelete,
  onTogglePin,
  canEdit = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    title,
    content,
    priority = 'normal',
    visibleTo = 'all',
    pinned,
    isRead,
    author,
    createdAt,
    updatedAt,
  } = announcement;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCardClick = (e) => {
    if (dropdownRef.current?.contains(e.target)) return;
    onClick?.();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    onEdit?.(announcement);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    onDelete?.(announcement);
  };

  const handleTogglePin = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    onTogglePin?.(announcement);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const priorityBadge = priorityConfig[priority] || priorityConfig.normal;
  const audienceLabel = audienceLabels[visibleTo];
  const displayTime = updatedAt || createdAt;

  return (
    <div
      onClick={handleCardClick}
      className={`relative group p-4 rounded-xl border transition-all duration-150 ease-out cursor-pointer bg-void-elevated hover:bg-void-elevated/80 ${
        !isRead
          ? 'border-l-2 border-l-blade-blue border-t-white/5 border-r-white/5 border-b-white/5'
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isRead && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blade-blue shadow-[0_0_8px_rgba(0,112,243,0.5)]" />
          )}
          <h3 className={`text-sm truncate ${
            isRead ? 'font-normal text-text-secondary' : 'font-semibold text-text-primary'
          }`}>
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {pinned && (
            <span className="text-warning-orange" title="Pinned">
              <Pin className="w-4 h-4" />
            </span>
          )}

          {canEdit && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={toggleDropdown}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/[0.04] transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 w-36 py-1 rounded-lg border border-white/5 bg-void-elevated shadow-xl"
                >
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleTogglePin}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    <Pin className="w-4 h-4" />
                    {pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-red hover:bg-danger-red/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content preview */}
      <p className="text-sm text-text-muted line-clamp-2 mb-3">
        {content}
      </p>

      {/* Bottom row: Badges and metadata */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {priority !== 'normal' && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${priorityBadge.color}`}>
              {priorityBadge.label}
            </span>
          )}
          {audienceLabel && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-coxswain-violet/10 text-coxswain-violet border border-coxswain-violet/20">
              {audienceLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-text-muted">
          {author && (
            <>
              <span>{typeof author === 'object' ? author.name : author}</span>
              <span>-</span>
            </>
          )}
          <span>{formatRelativeTime(displayTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
