/**
 * Social-styled activity item with avatar circles, action-typed icons, and relative time.
 *
 * Layout: [Left border accent] [Avatar circle OR action icon] [Rich text with bolded name] [Relative timestamp]
 * Each event type has its own icon, color scheme, and descriptive verb.
 */
import {
  IconUserPlus,
  IconUserMinus,
  IconShield,
  IconMegaphone,
  IconSparkles,
  IconSettings,
  IconLink,
  IconDumbbell,
  IconTrophy,
  IconMedal,
  IconCheckCircle,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';
import type { ActivityEvent, ActivityEventType } from '../types';

interface ActivityItemProps {
  event: ActivityEvent;
}

interface EventConfig {
  icon: IconComponent;
  /** Tailwind text color for the icon */
  iconColor: string;
  /** Tailwind bg color for the icon circle */
  iconBg: string;
  /** Tailwind border-l color for the left accent */
  borderColor: string;
  /** Returns [action verb part] that follows the bolded actor name */
  verb: (event: ActivityEvent) => string;
}

const EVENT_CONFIG: Record<ActivityEventType, EventConfig> = {
  member_joined: {
    icon: IconUserPlus,
    iconColor: 'text-data-good',
    iconBg: 'bg-data-good/10',
    borderColor: 'border-l-data-good/60',
    verb: () => ' joined the team',
  },
  member_left: {
    icon: IconUserMinus,
    iconColor: 'text-data-poor',
    iconBg: 'bg-data-poor/10',
    borderColor: 'border-l-data-poor/60',
    verb: () => ' left the team',
  },
  role_changed: {
    icon: IconShield,
    iconColor: 'text-data-warning',
    iconBg: 'bg-data-warning/10',
    borderColor: 'border-l-data-warning/60',
    verb: (e) => {
      const data = e.data as { newRole?: string } | null;
      const role = data?.newRole ?? 'a new role';
      return ` was promoted to ${role}`;
    },
  },
  announcement: {
    icon: IconMegaphone,
    iconColor: 'text-accent-teal',
    iconBg: 'bg-accent-teal/10',
    borderColor: 'border-l-accent-teal/60',
    verb: (e) => {
      const truncated = e.title.length > 50 ? e.title.slice(0, 47) + '...' : e.title;
      return ` posted: "${truncated}"`;
    },
  },
  team_created: {
    icon: IconSparkles,
    iconColor: 'text-data-good',
    iconBg: 'bg-data-good/10',
    borderColor: 'border-l-data-good/60',
    verb: () => ' created the team',
  },
  team_updated: {
    icon: IconSettings,
    iconColor: 'text-text-dim',
    iconBg: 'bg-void-deep',
    borderColor: 'border-l-text-dim/40',
    verb: () => ' updated team settings',
  },
  invite_generated: {
    icon: IconLink,
    iconColor: 'text-accent-teal',
    iconBg: 'bg-accent-teal/10',
    borderColor: 'border-l-accent-teal/60',
    verb: () => ' generated an invite link',
  },
  workout: {
    icon: IconDumbbell,
    iconColor: 'text-data-good',
    iconBg: 'bg-data-good/10',
    borderColor: 'border-l-data-good/60',
    verb: (e) => {
      const data = e.data as { distance?: number; type?: string } | null;
      const parts: string[] = [];
      if (data?.type) parts.push(data.type);
      if (data?.distance) parts.push(`${data.distance}m`);
      const suffix = parts.length > 0 ? ` (${parts.join(' ')})` : '';
      return ` logged a workout${suffix}`;
    },
  },
  pr: {
    icon: IconTrophy,
    iconColor: 'text-data-warning',
    iconBg: 'bg-data-warning/10',
    borderColor: 'border-l-data-warning/60',
    verb: () => ' set a new personal record',
  },
  session_completed: {
    icon: IconCheckCircle,
    iconColor: 'text-data-good',
    iconBg: 'bg-data-good/10',
    borderColor: 'border-l-data-good/60',
    verb: () => ' completed a training session',
  },
  achievement_unlocked: {
    icon: IconMedal,
    iconColor: 'text-data-warning',
    iconBg: 'bg-data-warning/10',
    borderColor: 'border-l-data-warning/60',
    verb: () => ' unlocked an achievement',
  },
};

const FALLBACK_CONFIG: EventConfig = {
  icon: IconSettings,
  iconColor: 'text-text-faint',
  iconBg: 'bg-void-deep',
  borderColor: 'border-l-edge-default',
  verb: (e) => ` ${e.title}`,
};

/**
 * Generate a deterministic color from a name string for avatar backgrounds.
 * Returns a Tailwind bg class.
 */
const AVATAR_COLORS = [
  'bg-accent-teal/20',
  'bg-accent-teal-primary/20',
  'bg-accent-teal-primary/20',
  'bg-data-good/20',
  'bg-data-warning/20',
  'bg-accent-teal-primary/20',
  'bg-data-excellent/20',
  'bg-data-warning/20',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityItem({ event }: ActivityItemProps) {
  const config = EVENT_CONFIG[event.type] ?? FALLBACK_CONFIG;
  const Icon = config.icon;
  const verb = config.verb(event);
  const timeAgo = getTimeAgo(event.createdAt);

  return (
    <div
      className={`flex items-center gap-3 border-l-2 ${config.borderColor} rounded-lg px-3 py-2.5 transition-colors hover:bg-void-overlay/30`}
    >
      {/* Avatar circle (photo > initials > action icon fallback) */}
      {event.actorAvatarUrl ? (
        <img
          src={event.actorAvatarUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : event.actorName ? (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getAvatarColor(event.actorName)} text-xs font-semibold text-text-bright`}
        >
          {getInitials(event.actorName)}
        </div>
      ) : (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon width={16} height={16} className={config.iconColor} />
        </div>
      )}

      {/* Rich text description */}
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-text-dim">
        {event.actorName ? (
          <>
            <span className="font-semibold text-text-bright">{event.actorName}</span>
            {verb}
          </>
        ) : (
          <>
            <Icon
              width={14}
              height={14}
              className={`inline-block align-text-bottom mr-1 ${config.iconColor}`}
            />
            {event.title || verb.trim()}
          </>
        )}
      </p>

      {/* Relative timestamp */}
      <time
        dateTime={event.createdAt}
        className="shrink-0 text-xs tabular-nums text-text-faint"
        title={new Date(event.createdAt).toLocaleString()}
      >
        {timeAgo}
      </time>
    </div>
  );
}
