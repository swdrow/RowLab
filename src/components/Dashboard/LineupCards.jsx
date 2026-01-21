import React, { useState } from 'react';
import {
  Ship,
  History,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Edit3,
  MessageSquare,
  RotateCcw,
  Clock,
} from 'lucide-react';

/**
 * LineupCards - Active boat configurations with version history
 *
 * Features:
 * - Version control (like git commits)
 * - View diff between versions
 * - Revert to previous versions
 * - Notes attached to each version
 */
function LineupCards({
  lineups = [], // Array of { id, name, boatType, seats, coxswain, versions, currentVersion, notes }
  onSwapAthletes,
  onViewHistory,
  onRevert,
  onAddNote,
  onSelect,
  selectedId = null,
  className = '',
}) {
  const [expandedId, setExpandedId] = useState(null);

  // Get seat position label
  const getSeatLabel = (position, boatType) => {
    if (position === 0) return 'Cox';
    return position;
  };

  // Get side color
  const getSideColor = (side) => {
    if (side === 'P') return 'danger-red';
    if (side === 'S') return 'starboard';
    return 'text-secondary';
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-white/[0.04]">
        <div className="w-10 h-10 rounded-xl bg-spectrum-violet/10 border border-spectrum-violet/20 flex items-center justify-center">
          <Ship size={20} className="text-spectrum-violet" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary">Lineup Cards</h3>
          <p className="text-xs text-text-muted">{lineups.length} active configurations</p>
        </div>
      </div>

      {/* Lineup list */}
      <div className="divide-y divide-white/[0.03]">
        {lineups.map((lineup) => {
          const isExpanded = expandedId === lineup.id;
          const isSelected = selectedId === lineup.id;

          return (
            <div
              key={lineup.id}
              className={`
                transition-colors duration-100
                ${isSelected ? 'bg-blade-blue/5' : ''}
              `}
            >
              {/* Card header */}
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : lineup.id);
                  onSelect?.(lineup.id);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold
                    ${isSelected ? 'bg-blade-blue/20 text-blade-blue' : 'bg-void-surface text-text-secondary'}
                  `}>
                    {lineup.boatType?.replace(/[^0-9+]/g, '') || '8+'}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-text-primary">{lineup.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>{lineup.boatType}</span>
                      {lineup.currentVersion && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <History size={10} />
                            v{lineup.currentVersion}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Boat diagram */}
                  <div className="p-3 rounded-lg bg-void-deep/50 border border-white/[0.04]">
                    <div className="flex items-center justify-center gap-1">
                      {/* Coxswain */}
                      {lineup.coxswain && (
                        <div className="w-8 h-10 rounded bg-coxswain-violet/20 border border-coxswain-violet/40 flex flex-col items-center justify-center">
                          <span className="text-[8px] font-bold text-coxswain-violet">C</span>
                          <span className="text-[6px] text-text-muted truncate max-w-[30px]">
                            {lineup.coxswain.lastName?.slice(0, 3)}
                          </span>
                        </div>
                      )}

                      {/* Seats */}
                      {lineup.seats?.map((seat, index) => {
                        const seatNum = lineup.seats.length - index;
                        const sideColor = getSideColor(seat.athlete?.side);

                        return (
                          <div
                            key={index}
                            className={`
                              w-8 h-10 rounded border flex flex-col items-center justify-center
                              ${seat.athlete
                                ? `bg-${sideColor}/10 border-${sideColor}/30`
                                : 'bg-void-surface border-white/[0.06] border-dashed'
                              }
                            `}
                          >
                            <span className={`text-[8px] font-bold ${seat.athlete ? `text-${sideColor}` : 'text-text-muted'}`}>
                              {seatNum}
                            </span>
                            {seat.athlete && (
                              <span className="text-[6px] text-text-muted truncate max-w-[30px]">
                                {seat.athlete.lastName?.slice(0, 3)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  {lineup.notes && (
                    <div className="p-3 rounded-lg bg-void-surface border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-1.5 text-xs text-text-muted">
                        <MessageSquare size={12} />
                        <span>Notes</span>
                      </div>
                      <p className="text-sm text-text-secondary">{lineup.notes}</p>
                    </div>
                  )}

                  {/* Version history preview */}
                  {lineup.versions && lineup.versions.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <History size={12} />
                          Recent changes
                        </span>
                        <button
                          onClick={() => onViewHistory?.(lineup.id)}
                          className="text-xs text-blade-blue hover:underline"
                        >
                          View all
                        </button>
                      </div>
                      {lineup.versions.slice(0, 2).map((version, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-void-surface/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-text-muted">v{version.number}</span>
                            {version.change && (
                              <span className="flex items-center gap-1 text-text-secondary">
                                <ArrowLeftRight size={10} />
                                {version.change}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted">{formatRelativeTime(version.date)}</span>
                            {i > 0 && (
                              <button
                                onClick={() => onRevert?.(lineup.id, version.number)}
                                className="p-1 rounded hover:bg-white/[0.04] text-text-muted hover:text-text-primary"
                                title="Revert to this version"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSwapAthletes?.(lineup.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-xs hover:bg-blade-blue/20 transition-all"
                    >
                      <ArrowLeftRight size={14} />
                      <span>Swap Athletes</span>
                    </button>
                    <button
                      onClick={() => onAddNote?.(lineup.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-xs hover:text-text-primary hover:bg-white/[0.04] transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {lineups.length === 0 && (
        <div className="px-4 py-12 text-center">
          <Ship size={32} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-sm text-text-muted">No lineups configured</p>
          <p className="text-xs text-text-muted/60 mt-1">Create a lineup to see it here</p>
        </div>
      )}
    </div>
  );
}

export default LineupCards;
