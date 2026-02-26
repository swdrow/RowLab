/**
 * SearchResults: grouped result sections for the command palette.
 * Renders 6 entity types in order: Workouts, Athletes, Teams, Sessions, Pages, Actions.
 * Each section shows up to 3 items with a "See all" link if more exist.
 * Uses cmdk's Command.Group for grouping and Command.Item for items.
 */
import { Command } from 'cmdk';
import type { SearchEntry } from './searchRegistry';
import type { PreviewItem } from './SearchPreview';
import type {
  SearchWorkoutResult,
  SearchTeamResult,
  SearchSessionResult,
  SearchAthlete,
} from '@/hooks/useSearchData';
import { Skeleton } from '@/components/ui/Skeleton';
import { IconUser, IconDumbbell, IconUsers, IconCalendarDays } from '@/components/icons';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SearchResultsProps {
  query: string;
  // Entity results
  workouts: SearchWorkoutResult[];
  workoutsLoading: boolean;
  workoutsTotalCount: number;
  athletes: SearchAthlete[];
  athletesLoading: boolean;
  athletesTotalCount: number;
  teams: SearchTeamResult[];
  teamsLoading: boolean;
  teamsTotalCount: number;
  sessions: SearchSessionResult[];
  sessionsLoading: boolean;
  sessionsTotalCount: number;
  // Static results
  pages: SearchEntry[];
  commands: SearchEntry[];
  // Callbacks
  onSelectWorkout: (workout: SearchWorkoutResult) => void;
  onSelectAthlete: (athlete: SearchAthlete) => void;
  onSelectTeam: (team: SearchTeamResult) => void;
  onSelectSession: (session: SearchSessionResult) => void;
  onSelectPage: (path: string) => void;
  onSelectCommand: (entry: SearchEntry) => void;
  onHighlight: (item: PreviewItem) => void;
  onNavigate: (path: string) => void;
}

/* ------------------------------------------------------------------ */
/* Skeleton rows                                                       */
/* ------------------------------------------------------------------ */

function SkeletonRows() {
  return (
    <div className="px-3 py-2 space-y-2">
      {[60, 45, 55].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width="24px" height="24px" rounded="full" />
          <Skeleton width={`${w}%`} height="14px" rounded="sm" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "See all" link                                                      */
/* ------------------------------------------------------------------ */

function SeeAllLink({
  totalCount,
  label,
  onNavigate,
  path,
}: {
  totalCount: number;
  label: string;
  onNavigate: (path: string) => void;
  path: string;
}) {
  if (totalCount <= 3) return null;
  return (
    <Command.Item
      value={`see-all-${label.toLowerCase()}`}
      onSelect={() => onNavigate(path)}
      className="search-item text-accent-teal"
    >
      <span className="text-xs font-medium">
        See all {totalCount} {label}
      </span>
    </Command.Item>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function SearchResults({
  query,
  workouts,
  workoutsLoading,
  workoutsTotalCount,
  athletes,
  athletesLoading,
  athletesTotalCount,
  teams,
  teamsLoading,
  teamsTotalCount,
  sessions,
  sessionsLoading,
  sessionsTotalCount,
  pages,
  commands,
  onSelectWorkout,
  onSelectAthlete,
  onSelectTeam,
  onSelectSession,
  onSelectPage,
  onSelectCommand,
  onHighlight,
  onNavigate,
}: SearchResultsProps) {
  const hasQuery = query.length >= 2;
  const anyLoading = workoutsLoading || athletesLoading || teamsLoading || sessionsLoading;
  const anyResults =
    workouts.length > 0 ||
    athletes.length > 0 ||
    teams.length > 0 ||
    sessions.length > 0 ||
    pages.length > 0 ||
    commands.length > 0;

  return (
    <>
      {/* Workouts */}
      {hasQuery && (workoutsLoading || workouts.length > 0) && (
        <Command.Group heading="Workouts" className="search-group">
          {workoutsLoading ? (
            <SkeletonRows />
          ) : (
            <>
              {workouts.map((w) => (
                <Command.Item
                  key={w.id}
                  value={`workout-${w.id} ${w.composedTitle} ${w.dateStr}`}
                  onSelect={() => onSelectWorkout(w)}
                  className="search-item"
                  onMouseEnter={() => onHighlight({ type: 'workout', data: w })}
                  onFocus={() => onHighlight({ type: 'workout', data: w })}
                >
                  <IconDumbbell width={16} height={16} className="shrink-0 text-text-faint" />
                  <div className="min-w-0 flex-1">
                    <span className="text-text-bright">{w.composedTitle}</span>
                    <span className="ml-2 text-xs text-text-faint">{w.dateStr}</span>
                  </div>
                </Command.Item>
              ))}
              <SeeAllLink
                totalCount={workoutsTotalCount}
                label="Workouts"
                onNavigate={onNavigate}
                path="/workouts"
              />
            </>
          )}
        </Command.Group>
      )}

      {/* Athletes */}
      {hasQuery && (athletesLoading || athletes.length > 0) && (
        <Command.Group heading="Athletes" className="search-group">
          {athletesLoading ? (
            <SkeletonRows />
          ) : (
            <>
              {athletes.map((a) => (
                <Command.Item
                  key={a.id}
                  value={`athlete-${a.id} ${a.name} ${a.email ?? ''}`}
                  onSelect={() => onSelectAthlete(a)}
                  className="search-item"
                  onMouseEnter={() => onHighlight({ type: 'athlete', data: a })}
                  onFocus={() => onHighlight({ type: 'athlete', data: a })}
                >
                  <IconUser width={16} height={16} className="shrink-0 text-text-faint" />
                  <div className="min-w-0 flex-1">
                    <span className="text-text-bright">{a.name}</span>
                    {a.email && <span className="ml-2 text-xs text-text-faint">{a.email}</span>}
                  </div>
                </Command.Item>
              ))}
              <SeeAllLink
                totalCount={athletesTotalCount}
                label="Athletes"
                onNavigate={onNavigate}
                path="/athletes"
              />
            </>
          )}
        </Command.Group>
      )}

      {/* Teams */}
      {hasQuery && (teamsLoading || teams.length > 0) && (
        <Command.Group heading="Teams" className="search-group">
          {teamsLoading ? (
            <SkeletonRows />
          ) : (
            <>
              {teams.map((t) => (
                <Command.Item
                  key={t.id}
                  value={`team-${t.id} ${t.name} ${t.identifier}`}
                  onSelect={() => onSelectTeam(t)}
                  className="search-item"
                  onMouseEnter={() => onHighlight({ type: 'team', data: t })}
                  onFocus={() => onHighlight({ type: 'team', data: t })}
                >
                  <IconUsers width={16} height={16} className="shrink-0 text-text-faint" />
                  <div className="min-w-0 flex-1">
                    <span className="text-text-bright">{t.name}</span>
                    {t.memberCount != null && (
                      <span className="ml-2 text-xs text-text-faint">
                        {t.memberCount} member{t.memberCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Command.Item>
              ))}
              <SeeAllLink
                totalCount={teamsTotalCount}
                label="Teams"
                onNavigate={onNavigate}
                path="/team"
              />
            </>
          )}
        </Command.Group>
      )}

      {/* Sessions */}
      {hasQuery && (sessionsLoading || sessions.length > 0) && (
        <Command.Group heading="Sessions" className="search-group">
          {sessionsLoading ? (
            <SkeletonRows />
          ) : (
            <>
              {sessions.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`session-${s.id} ${s.name} ${s.type}`}
                  onSelect={() => onSelectSession(s)}
                  className="search-item"
                  onMouseEnter={() => onHighlight({ type: 'session', data: s })}
                  onFocus={() => onHighlight({ type: 'session', data: s })}
                >
                  <IconCalendarDays width={16} height={16} className="shrink-0 text-text-faint" />
                  <div className="min-w-0 flex-1">
                    <span className="text-text-bright">{s.name}</span>
                    <span className="ml-2 text-xs text-text-faint">{s.type}</span>
                  </div>
                </Command.Item>
              ))}
              <SeeAllLink
                totalCount={sessionsTotalCount}
                label="Sessions"
                onNavigate={onNavigate}
                path="/training"
              />
            </>
          )}
        </Command.Group>
      )}

      {/* Pages */}
      {pages.length > 0 && (
        <Command.Group heading="Pages" className="search-group">
          {pages.map((entry) => (
            <Command.Item
              key={entry.id}
              value={`page-${entry.id} ${entry.label} ${entry.keywords.join(' ')}`}
              onSelect={() => entry.path && onSelectPage(entry.path)}
              className="search-item"
              onMouseEnter={() => onHighlight({ type: 'page', data: entry })}
              onFocus={() => onHighlight({ type: 'page', data: entry })}
            >
              <entry.icon width={16} height={16} className="shrink-0 text-text-faint" />
              <div className="min-w-0 flex-1">
                <span className="text-text-bright">{entry.label}</span>
                {entry.description && (
                  <span className="ml-2 text-xs text-text-faint">{entry.description}</span>
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* Actions (Commands) */}
      {commands.length > 0 && (
        <Command.Group heading="Actions" className="search-group">
          {commands.map((entry) => (
            <Command.Item
              key={entry.id}
              value={`cmd-${entry.id} ${entry.label} ${entry.keywords.join(' ')}`}
              onSelect={() => onSelectCommand(entry)}
              className="search-item"
            >
              <entry.icon width={16} height={16} className="shrink-0 text-accent-teal" />
              <div className="min-w-0 flex-1">
                <span className="text-text-bright">{entry.label}</span>
                {entry.description && (
                  <span className="ml-2 text-xs text-text-faint">{entry.description}</span>
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {/* No results state */}
      {hasQuery && !anyLoading && !anyResults && (
        <div className="py-8 text-center">
          <p className="text-sm text-text-dim mb-2">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-text-faint">
            Try searching by workout title, athlete name, or team name
          </p>
        </div>
      )}
    </>
  );
}

/* === EMPTY STATE: Recents + Suggestions === */

interface EmptyStateProps {
  recents: { label: string; path: string }[];
  onSelectRecent: (path: string) => void;
  onSelectSuggestion: (path: string) => void;
  onLogWorkout?: () => void;
}

export function SearchEmptyState({
  recents,
  onSelectRecent,
  onSelectSuggestion,
  onLogWorkout,
}: EmptyStateProps) {
  return (
    <>
      {recents.length > 0 && (
        <Command.Group heading="Recent" className="search-group">
          {recents.map((item) => (
            <Command.Item
              key={item.path}
              value={`recent-${item.path} ${item.label}`}
              onSelect={() => onSelectRecent(item.path)}
              className="search-item"
            >
              <span className="text-text-bright">{item.label}</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      <Command.Group heading="Quick Actions" className="search-group">
        <Command.Item
          value="suggestion-log-workout"
          onSelect={() => {
            if (onLogWorkout) {
              onLogWorkout();
            } else {
              window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'));
            }
          }}
          className="search-item"
        >
          <span className="text-text-bright">Log workout</span>
        </Command.Item>
        <Command.Item
          value="suggestion-view-profile"
          onSelect={() => onSelectSuggestion('/profile')}
          className="search-item"
        >
          <span className="text-text-bright">View Profile & Stats</span>
        </Command.Item>
        <Command.Item
          value="suggestion-settings"
          onSelect={() => onSelectSuggestion('/settings')}
          className="search-item"
        >
          <span className="text-text-bright">Go to settings</span>
        </Command.Item>
      </Command.Group>
    </>
  );
}
