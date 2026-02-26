/**
 * MiniProfileCard — condensed profile in dashboard sidebar.
 * Avatar, name, username, follower/following counts, "View Profile" link.
 */
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { followStatsOptions } from '@/features/feed/api';

interface MiniProfileCardProps {
  userName: string;
  username?: string;
  avatar?: string | null;
}

export function MiniProfileCard({ userName, username, avatar }: MiniProfileCardProps) {
  const { data: followStats } = useQuery(followStatsOptions());

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card padding="md">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 h-16 w-16 rounded-full bg-void-raised flex items-center justify-center text-lg font-medium text-text-dim overflow-hidden">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <h3 className="font-display text-base font-semibold text-text-bright">{userName}</h3>
        {username && <span className="text-xs text-text-dim">@{username}</span>}

        {followStats && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div>
              <span className="font-mono font-bold text-text-bright">
                {followStats.followingCount}
              </span>
              <span className="ml-1 text-text-faint">Following</span>
            </div>
            <div>
              <span className="font-mono font-bold text-text-bright">
                {followStats.followersCount}
              </span>
              <span className="ml-1 text-text-faint">Followers</span>
            </div>
          </div>
        )}

        <Link
          to="/profile"
          search={{ tab: 'overview' }}
          className="mt-3 text-xs text-accent-teal hover:underline transition-colors"
        >
          View Profile
        </Link>
      </div>
    </Card>
  );
}
