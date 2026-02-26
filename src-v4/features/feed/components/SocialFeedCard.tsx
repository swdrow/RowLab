/**
 * SocialFeedCard — single workout in the social feed.
 * Machine type: colored dot + uppercase tag in Space Mono.
 * Stats row: Space Mono 400. Like button with count.
 *
 * Wrapped in React.memo — skips re-render when `item` reference is stable.
 */
import { memo, useState, useMemo, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { formatPace, formatDistance, formatDuration } from '@/lib/format';
import { toggleLike } from '../api';
import type { FeedItem } from '../types';

const MACHINE_COLORS: Record<string, string> = {
  rower: 'text-machine-rower bg-machine-rower/15',
  bikerg: 'text-machine-bike bg-machine-bike/15',
  skierg: 'text-machine-ski bg-machine-ski/15',
};

const MACHINE_DOT_COLORS: Record<string, string> = {
  rower: 'bg-machine-rower',
  bikerg: 'bg-machine-bike',
  skierg: 'bg-machine-ski',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface SocialFeedCardProps {
  item: FeedItem;
}

export const SocialFeedCard = memo(function SocialFeedCard({ item }: SocialFeedCardProps) {
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [liking, setLiking] = useState(false);

  const machineType = item.machineType || 'rower';
  const machineColor = MACHINE_COLORS[machineType] || MACHINE_COLORS.rower;
  const dotColor = MACHINE_DOT_COLORS[machineType] || MACHINE_DOT_COLORS.rower;

  // Memoize formatted strings — only recalculate when underlying data changes
  const timeString = useMemo(() => timeAgo(item.date), [item.date]);
  const distStr = useMemo(() => formatDistance(item.distanceM), [item.distanceM]);
  const durStr = useMemo(() => formatDuration(item.durationSeconds), [item.durationSeconds]);
  const paceStr = useMemo(() => formatPace(item.avgPace), [item.avgPace]);
  const initials = useMemo(
    () =>
      item.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2),
    [item.user.name]
  );

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const result = await toggleLike(item.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLiking(false);
    }
  }, [liked, liking, likeCount, item.id]);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4">
        {/* Header: avatar + name + time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-void-raised flex items-center justify-center text-xs font-medium text-text-dim">
              {item.user.avatarUrl ? (
                <img
                  src={item.user.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-bright">{item.user.name}</span>
              {item.user.username && (
                <span className="text-xs text-text-faint">@{item.user.username}</span>
              )}
            </div>
          </div>
          <span className="text-xs text-accent-ivory">{timeString}</span>
        </div>

        {/* Machine type tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          <span
            className={`rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${machineColor}`}
          >
            {machineType === 'bikerg' ? 'bike' : machineType === 'skierg' ? 'ski' : machineType}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatField label="Distance" value={distStr} />
          <StatField label="Time" value={durStr} />
          <StatField label="Pace" value={paceStr} />
          {item.strokeRate && <StatField label="Rate" value={`${item.strokeRate} spm`} />}
        </div>

        {/* Actions: like + view detail */}
        <div className="flex items-center justify-between border-t border-edge-default pt-3">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              liked ? 'text-accent-coral' : 'text-text-faint hover:text-text-dim'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likeCount > 0 && <span className="font-mono">{likeCount}</span>}
          </button>
          <Link
            to="/workouts/$workoutId"
            params={{ workoutId: item.id }}
            search={{ view: 'feed', calendarMode: 'monthly' }}
            className="text-xs text-accent-teal hover:underline transition-colors"
          >
            View details
          </Link>
        </div>
      </div>
    </Card>
  );
});

const StatField = memo(function StatField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-widest text-text-faint">
        {label}
      </span>
      <span className="font-mono text-sm text-text-default">{value}</span>
    </div>
  );
});
