import React, { useState, useMemo } from 'react';
import {
  Activity,
  Settings,
  Download,
  Plus,
  Radio,
  Clock,
  Zap,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

/**
 * LiveWorkoutDashboard - Real-time erg data during practice
 *
 * Features:
 * - Spreadsheet-style table (based on real coach erg sheets)
 * - Workout configurator (templates, custom)
 * - Live status indicators
 * - Manual entry fallback
 */

// Quick-start workout templates
const WORKOUT_TEMPLATES = [
  { id: '2k', name: '2k Test', pieces: 1, distance: 2000, type: 'fixed-distance' },
  { id: '6k', name: '6k Test', pieces: 1, distance: 6000, type: 'fixed-distance' },
  { id: '3x1500', name: '3x1500m', pieces: 3, distance: 1500, type: 'intervals' },
  { id: '4x1000', name: '4x1000m', pieces: 4, distance: 1000, type: 'intervals' },
  { id: '5x500', name: '5x500m', pieces: 5, distance: 500, type: 'intervals' },
  { id: 'custom', name: 'Custom...', pieces: null, distance: null, type: 'custom' },
];

function LiveWorkoutDashboard({
  athletes = [],
  workoutData = {}, // { athleteId: { pieces: [{ time, split, strokeRate, watts }], status: 'live'|'complete' } }
  activeWorkout = null, // { template, startTime }
  onConfigureWorkout,
  onExportData,
  onAddAthlete,
  onManualEntry,
  isPolling = false,
  className = '',
  // Permission props for role-based access control
  canConfigure = true,
  canExport = true,
  canManualEntry = true,
  canAddAthlete = true,
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Format time in M:SS.T
  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format split
  const formatSplit = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Calculate averages for an athlete
  const calculateAverages = (pieces) => {
    if (!pieces || pieces.length === 0) return { avgSplit: null, totalTime: null };

    const validPieces = pieces.filter(p => p.time && p.split);
    if (validPieces.length === 0) return { avgSplit: null, totalTime: null };

    const totalTime = validPieces.reduce((sum, p) => sum + p.time, 0);
    const avgSplit = validPieces.reduce((sum, p) => sum + p.split, 0) / validPieces.length;

    return { avgSplit, totalTime };
  };

  // Number of pieces to show
  const pieceCount = activeWorkout?.template?.pieces ||
    Math.max(...athletes.map(a => workoutData[a.id]?.pieces?.length || 0), 3);

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isPolling
              ? 'bg-spectrum-cyan/20 border border-spectrum-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-void-surface border border-white/[0.06]'
            }
          `}>
            <Activity size={20} className={isPolling ? 'text-spectrum-cyan' : 'text-text-muted'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">
                {activeWorkout ? activeWorkout.template.name : 'Live Workout'}
              </h3>
              {isPolling && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-spectrum-cyan/10 text-spectrum-cyan text-[10px] font-medium">
                  <Radio size={10} className="animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {activeWorkout
                ? `Started ${new Date(activeWorkout.startTime).toLocaleTimeString()}`
                : 'Select a workout to begin'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Workout selector - only show if user can configure */}
          {canConfigure && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blade-blue/10 border border-blade-blue/20 text-blade-blue text-xs hover:bg-blade-blue/20 transition-all"
              >
                <Settings size={14} />
                <span>Configure</span>
                <ChevronDown size={14} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>

              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-void-elevated border border-white/10 shadow-2xl z-20">
                  {WORKOUT_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplates(false);
                        onConfigureWorkout?.(template);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export - only show if user can export */}
          {canExport && (
            <button
              onClick={onExportData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-xs hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {/* Refresh indicator */}
          {isPolling && (
            <div className="w-8 h-8 flex items-center justify-center">
              <RefreshCw size={14} className="text-spectrum-cyan animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="sticky left-0 z-10 bg-void-elevated px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted w-40">
                Athlete
              </th>
              {Array.from({ length: pieceCount }, (_, i) => (
                <th key={i} className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted min-w-[100px]">
                  Piece {i + 1}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted min-w-[100px]">
                Avg Split
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted min-w-[100px]">
                Total Time
              </th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete, rowIndex) => {
              const data = workoutData[athlete.id] || {};
              const pieces = data.pieces || [];
              const { avgSplit, totalTime } = calculateAverages(pieces);
              const isLive = data.status === 'live';

              return (
                <tr
                  key={athlete.id}
                  className={`
                    border-b border-white/[0.03] transition-colors duration-100
                    ${isLive ? 'bg-spectrum-cyan/5' : 'hover:bg-white/[0.02]'}
                  `}
                >
                  {/* Athlete name */}
                  <td className="sticky left-0 z-10 bg-void-elevated px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="w-2 h-2 rounded-full bg-spectrum-cyan animate-pulse" />
                      )}
                      <span className="text-sm text-text-primary font-medium">
                        {athlete.firstName?.charAt(0)}. {athlete.lastName}
                      </span>
                    </div>
                  </td>

                  {/* Piece times */}
                  {Array.from({ length: pieceCount }, (_, i) => {
                    const piece = pieces[i];
                    const isCurrentPiece = isLive && i === pieces.length;

                    return (
                      <td
                        key={i}
                        className={`
                          px-4 py-3 text-center
                          ${isCurrentPiece ? 'bg-spectrum-cyan/10' : ''}
                        `}
                      >
                        {piece ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-sm text-text-primary tabular-nums">
                              {formatTime(piece.time)}
                            </div>
                            <div className="font-mono text-xs text-blade-blue tabular-nums">
                              {formatSplit(piece.split)}
                            </div>
                            {piece.strokeRate && (
                              <div className="text-[10px] text-text-muted">
                                {piece.strokeRate} spm
                              </div>
                            )}
                          </div>
                        ) : isCurrentPiece ? (
                          <span className="inline-flex items-center gap-1 text-xs text-spectrum-cyan">
                            <Radio size={10} className="animate-pulse" />
                            Live
                          </span>
                        ) : canManualEntry ? (
                          <button
                            onClick={() => onManualEntry?.(athlete.id, i)}
                            className="text-xs text-text-muted hover:text-blade-blue transition-colors"
                          >
                            —
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Avg Split */}
                  <td className="px-4 py-3 text-center font-mono text-sm text-blade-blue tabular-nums">
                    {formatSplit(avgSplit)}
                  </td>

                  {/* Total Time */}
                  <td className="px-4 py-3 text-center font-mono text-sm text-text-primary tabular-nums">
                    {formatTime(totalTime)}
                  </td>
                </tr>
              );
            })}

            {/* Add athlete row - only show if user has permission */}
            {canAddAthlete && onAddAthlete && (
              <tr>
                <td colSpan={pieceCount + 3} className="px-4 py-3">
                  <button
                    onClick={onAddAthlete}
                    className="flex items-center gap-2 text-xs text-text-muted hover:text-blade-blue transition-colors"
                  >
                    <Plus size={14} />
                    <span>Add Athlete</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {athletes.length === 0 && (
        <div className="px-4 py-12 text-center">
          <Activity size={32} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-sm text-text-muted">No athletes in this workout</p>
          <p className="text-xs text-text-muted/60 mt-1">Add athletes to track their progress</p>
        </div>
      )}
    </div>
  );
}

export default LiveWorkoutDashboard;
