/**
 * PublicationAthletes - Editorial-style athlete roster
 *
 * Feels like a team lineup printed in a sports magazine.
 * Two views: Magazine Grid (default) and Linear Table.
 * Serif headings, monospace data, data-colored metrics,
 * slide-in panel for athlete detail.
 *
 * Design principles:
 * - Monochrome chrome, chromatic data
 * - Serif heading, statistics subtitle
 * - Magazine-style grid OR ultra-clean table
 * - Slide-in panel for details (no page navigation)
 */

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, Search, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAthletes } from '@v2/hooks/useAthletes';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import { AthleteProfilePanel } from '@v2/features/athletes/components/profile/AthleteProfilePanel';
import type { Athlete, AthleteFilters } from '@v2/types/athletes';

// ============================================
// Types
// ============================================

type ViewMode = 'grid' | 'table';

// ============================================
// Helper: format time
// ============================================

/**
 * Erg time display helpers.
 * The base Athlete type does not include erg data inline,
 * so for this prototype we show a placeholder.
 * In production this would come from AthleteWithStats or a joined query.
 */
function formatErgTime(_seconds: number | null | undefined): string {
  // Prototype: no inline erg data on Athlete type
  return '--:--';
}

function getErgColor(_seconds: number | null | undefined): string {
  return 'text-ink-muted';
}

function getAttendanceColor(pct: number): string {
  if (pct >= 90) return 'bg-data-excellent';
  if (pct >= 75) return 'bg-data-warning';
  return 'bg-data-poor';
}

// ============================================
// Stagger animation
// ============================================

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// Main Component
// ============================================

export function PublicationAthletes() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch athletes
  const filters = useMemo<AthleteFilters>(
    () => ({
      search: searchQuery || undefined,
      sortBy: 'name',
      sortDir: 'asc',
    }),
    [searchQuery]
  );
  const { athletes, allAthletes, isLoading } = useAthletes(filters);

  // Derived stats
  const sideStats = useMemo(() => {
    const counts = { Port: 0, Starboard: 0, Both: 0, Cox: 0, unknown: 0 };
    allAthletes.forEach((a) => {
      if (a.side && a.side in counts) {
        counts[a.side as keyof typeof counts]++;
      } else {
        counts.unknown++;
      }
    });
    return counts;
  }, [allAthletes]);

  // Panel handlers
  const handleAthleteClick = useCallback((athlete: Athlete) => {
    setSelectedAthleteId(athlete.id);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedAthleteId(null), 300);
  }, []);

  return (
    <div className="min-h-screen bg-ink-deep">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ============================================
            EDITORIAL HEADER
            ============================================ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="font-display text-5xl font-bold text-ink-bright tracking-tight mb-3">
            Your Roster
          </h1>
          <p className="text-lg text-ink-body">
            <span className="font-mono text-ink-bright">{allAthletes.length}</span> athletes
            {sideStats.Port > 0 && (
              <>
                {' '}
                &middot; <span className="font-mono text-data-poor">{sideStats.Port}</span> port
              </>
            )}
            {sideStats.Starboard > 0 && (
              <>
                {' '}
                &middot;{' '}
                <span className="font-mono text-data-excellent">{sideStats.Starboard}</span>{' '}
                starboard
              </>
            )}
            {sideStats.Both > 0 && (
              <>
                {' '}
                &middot; <span className="font-mono text-data-good">{sideStats.Both}</span> both
              </>
            )}
            {sideStats.Cox > 0 && (
              <>
                {' '}
                &middot; <span className="font-mono text-ink-body">{sideStats.Cox}</span> cox
              </>
            )}
          </p>
        </motion.section>

        {/* ============================================
            TOOLBAR - Search + View Toggle + Add
            ============================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-ink-well border border-ink-border rounded-md text-ink-body placeholder:text-ink-muted focus:outline-none focus:border-ink-border-strong transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-ink-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-ink-raised text-ink-bright'
                  : 'text-ink-secondary hover:text-ink-body'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-ink-raised text-ink-bright'
                  : 'text-ink-secondary hover:text-ink-body'
              }`}
              title="Table view"
            >
              <List size={16} />
            </button>
          </div>

          {/* Add athlete */}
          <button
            onClick={() => navigate('/app/athletes/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink-bright text-ink-deep rounded-md hover:bg-ink-primary transition-colors"
          >
            <UserPlus size={14} />
            Add Athlete
          </button>
        </motion.div>

        {/* ============================================
            CONTENT AREA
            ============================================ */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : athletes.length === 0 ? (
          <EmptyState hasAthletes={allAthletes.length > 0} />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                variants={stagger}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <MagazineGrid athletes={athletes} onAthleteClick={handleAthleteClick} />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EditorialTable athletes={athletes} onAthleteClick={handleAthleteClick} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Athlete Profile Panel */}
      <AthleteProfilePanel
        athleteId={selectedAthleteId}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </div>
  );
}

// ============================================
// Magazine Grid View
// ============================================

function MagazineGrid({
  athletes,
  onAthleteClick,
}: {
  athletes: Athlete[];
  onAthleteClick: (a: Athlete) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {athletes.map((athlete) => (
        <motion.div key={athlete.id} variants={fadeUp}>
          <AthleteStoryCard athlete={athlete} onClick={() => onAthleteClick(athlete)} />
        </motion.div>
      ))}
    </div>
  );
}

/** Individual athlete "story card" - magazine style */
function AthleteStoryCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  // Mock attendance percentage (prototype)
  const attendancePct = useMemo(() => 70 + Math.floor(Math.random() * 30), []);

  const sideLabel = athlete.side || '--';
  const sideColor =
    athlete.side === 'Port'
      ? 'text-data-poor'
      : athlete.side === 'Starboard'
        ? 'text-data-excellent'
        : athlete.side === 'Both'
          ? 'text-data-good'
          : 'text-ink-muted';

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-ink-border rounded-lg p-4 bg-ink-base/30 hover:border-ink-border-strong hover:bg-ink-base/60 transition-all duration-150 group"
    >
      {/* Avatar */}
      <div className="mb-3">
        <AthleteAvatar firstName={athlete.firstName} lastName={athlete.lastName} size="md" />
      </div>

      {/* Name */}
      <h3 className="font-display text-base font-semibold text-ink-bright group-hover:text-ink-bright mb-0.5">
        {athlete.firstName} {athlete.lastName}
      </h3>

      {/* Side */}
      <p className={`text-xs font-mono ${sideColor} mb-3`}>{sideLabel}</p>

      {/* 2k time placeholder (erg data not on base Athlete type) */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">2k</span>
        <span className={`font-mono text-sm font-semibold ${getErgColor(null)}`}>
          {formatErgTime(null)}
        </span>
      </div>

      {/* Attendance bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Att</span>
        <div className="flex-1 h-1 bg-ink-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getAttendanceColor(attendancePct)} transition-all`}
            style={{ width: `${attendancePct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-ink-secondary">{attendancePct}%</span>
      </div>
    </button>
  );
}

// ============================================
// Editorial Table View (Linear-inspired)
// ============================================

function EditorialTable({
  athletes,
  onAthleteClick,
}: {
  athletes: Athlete[];
  onAthleteClick: (a: Athlete) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-ink-border">
            <th className="pb-3 pr-4 text-left text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Athlete
            </th>
            <th className="pb-3 px-4 text-left text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Side
            </th>
            <th className="pb-3 px-4 text-left text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Status
            </th>
            <th className="pb-3 px-4 text-left text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Year
            </th>
            <th className="pb-3 px-4 text-right text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              2k Time
            </th>
            <th className="pb-3 px-4 text-right text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Weight
            </th>
            <th className="pb-3 pl-4 text-right text-[10px] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Height
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {athletes.map((athlete) => {
            const sideColor =
              athlete.side === 'Port'
                ? 'text-data-poor'
                : athlete.side === 'Starboard'
                  ? 'text-data-excellent'
                  : athlete.side === 'Both'
                    ? 'text-data-good'
                    : 'text-ink-muted';

            return (
              <tr
                key={athlete.id}
                onClick={() => onAthleteClick(athlete)}
                className="border-b border-ink-border/30 cursor-pointer hover:bg-ink-bright/[0.02] transition-colors group"
              >
                {/* Name (serif) */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <AthleteAvatar
                      firstName={athlete.firstName}
                      lastName={athlete.lastName}
                      size="sm"
                    />
                    <span className="font-display text-sm font-medium text-ink-bright group-hover:text-ink-bright">
                      {athlete.firstName} {athlete.lastName}
                    </span>
                  </div>
                </td>

                {/* Side */}
                <td className={`py-3 px-4 font-mono text-xs ${sideColor}`}>
                  {athlete.side || '--'}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <StatusPill status={athlete.status || 'active'} />
                </td>

                {/* Year */}
                <td className="py-3 px-4 font-mono text-xs text-ink-secondary">
                  {athlete.classYear || '--'}
                </td>

                {/* 2k */}
                <td className="py-3 px-4 text-right">
                  <span className={`font-mono text-sm font-semibold ${getErgColor(null)}`}>
                    {formatErgTime(null)}
                  </span>
                </td>

                {/* Weight */}
                <td className="py-3 px-4 text-right font-mono text-xs text-ink-secondary">
                  {athlete.weightKg ? `${athlete.weightKg}kg` : '--'}
                </td>

                {/* Height */}
                <td className="py-3 pl-4 text-right font-mono text-xs text-ink-secondary">
                  {athlete.heightCm ? `${athlete.heightCm}cm` : '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Minimal status pill */
function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'text-data-excellent',
    injured: 'text-data-warning',
    inactive: 'text-ink-muted',
    graduated: 'text-data-good',
  };

  return (
    <span className={`text-xs font-mono capitalize ${colors[status] || 'text-ink-muted'}`}>
      {status}
    </span>
  );
}

// ============================================
// Loading & Empty States
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-ink-raised/50 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ hasAthletes }: { hasAthletes: boolean }) {
  return (
    <div className="text-center py-20">
      <h3 className="font-display text-xl text-ink-bright mb-2">
        {hasAthletes ? 'No athletes match your search' : 'No athletes yet'}
      </h3>
      <p className="text-sm text-ink-secondary">
        {hasAthletes
          ? 'Try adjusting your search query.'
          : 'Add your first athlete to get started.'}
      </p>
    </div>
  );
}

export default PublicationAthletes;
