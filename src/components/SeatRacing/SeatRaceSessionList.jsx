import { useEffect } from 'react';
import useSeatRaceStore from '../../store/seatRaceStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * Displays a list of seat racing sessions with create button
 *
 * @param {Object} props
 * @param {function} props.onSelectSession - Callback when session clicked
 * @param {function} props.onCreateNew - Callback for new session button
 */
function SeatRaceSessionList({ onSelectSession, onCreateNew }) {
  const { sessions, loading, error, fetchSessions } = useSeatRaceStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConditionsBadgeVariant = (conditions) => {
    if (!conditions) return 'default';
    const lower = conditions.toLowerCase();
    if (lower.includes('calm') || lower.includes('flat')) return 'success';
    if (lower.includes('choppy') || lower.includes('rough')) return 'warning';
    if (lower.includes('windy') || lower.includes('strong')) return 'error';
    return 'info';
  };

  const getBoatClassBadgeVariant = (boatClass) => {
    if (!boatClass) return 'default';
    if (boatClass.includes('8')) return 'purple';
    if (boatClass.includes('4')) return 'blue';
    if (boatClass.includes('2')) return 'cyan';
    if (boatClass.includes('1')) return 'emerald';
    return 'default';
  };

  // Loading state
  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="animate-spin h-10 w-10 text-accent"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-4 text-text-secondary">Loading sessions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 mb-4 rounded-full bg-spectrum-red/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-spectrum-red"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-text-primary font-medium mb-2">Error loading sessions</p>
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <Button variant="secondary" onClick={() => fetchSessions()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 mb-4 rounded-full bg-surface-700 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <p className="text-text-primary font-medium mb-2">No seat race sessions yet</p>
        <p className="text-text-secondary text-sm mb-6 text-center max-w-sm">
          Create your first seat race session to start comparing rower performance and finding
          your fastest combinations.
        </p>
        <Button variant="primary" onClick={onCreateNew}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Session
        </Button>
      </div>
    );
  }

  // Session list
  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Seat Race Sessions</h2>
          <p className="text-sm text-text-secondary mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={onCreateNew}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </Button>
      </div>

      {/* Sessions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card
            key={session.id}
            variant="interactive"
            padding="md"
            className="group"
            onClick={() => onSelectSession(session)}
          >
            {/* Date */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-primary">
                {formatDate(session.date)}
              </span>
              <svg
                className="w-5 h-5 text-text-tertiary group-hover:text-accent transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {session.boatClass && (
                <Badge variant={getBoatClassBadgeVariant(session.boatClass)} size="sm">
                  {session.boatClass}
                </Badge>
              )}
              {session.conditions && (
                <Badge variant={getConditionsBadgeVariant(session.conditions)} size="sm">
                  {session.conditions}
                </Badge>
              )}
            </div>

            {/* Location */}
            {session.location && (
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4 text-text-tertiary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm text-text-secondary truncate">
                  {session.location}
                </span>
              </div>
            )}

            {/* Piece count */}
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-sm text-text-secondary">
                {session.pieces?.length || 0} piece{(session.pieces?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SeatRaceSessionList;
