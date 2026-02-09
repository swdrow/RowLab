/**
 * CanvasRankingsPage - Rankings leaderboard with Canvas design language
 *
 * Canvas redesign of RankingsPage.tsx with:
 * - CanvasDataTable for rankings display
 * - ScrambleNumber for all numeric values
 * - RuledHeader for section labels
 * - CanvasTabs for Speed Rankings vs Head-to-Head
 * - CanvasSelect for team/boat class selection
 * - NO rounded corners, NO card wrappers
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Plus } from 'lucide-react';
import {
  RuledHeader,
  CanvasConsoleReadout,
  CanvasTabs,
  CanvasSelect,
  CanvasButton,
  CanvasModal,
} from '@v2/components/canvas';
import { useExternalTeams, useBoatClassRankings } from '../../hooks/useTeamRankings';
import { useRegattaKeyboard } from '../../hooks/useRegattaKeyboard';
import { queryKeys } from '../../lib/queryKeys';
import { getBoatClasses } from '../../utils/marginCalculations';
import { RankingsView, HeadToHeadTable, NCAAExportDialog } from '../../components/rankings';

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function CanvasRankingsPage() {
  const queryClient = useQueryClient();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedBoatClass] = useState<string | null>(null);
  const [selectedComparison, setSelectedComparison] = useState<{
    opponent: string;
    boatClass: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'rankings' | 'head-to-head'>('rankings');

  const { data: externalTeams } = useExternalTeams();
  const boatClasses = getBoatClasses();
  const { data: rankings } = useBoatClassRankings(selectedBoatClass || undefined);

  // Keyboard shortcuts
  useRegattaKeyboard({
    onRefresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.teamRankings.all }),
    onExport: () => setIsExportOpen(true),
    onEscape: () => {
      if (isImportOpen) setIsImportOpen(false);
      if (isExportOpen) setIsExportOpen(false);
    },
  });

  const handleSelectTeam = useCallback((teamName: string, boatClass: string) => {
    setSelectedComparison({ opponent: teamName, boatClass });
  }, []);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ============================================ */}
      {/* HEADER — text against void (no card wrapper) */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Competitive Analysis
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Team Rankings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CanvasButton
            variant="primary"
            onClick={() => setIsExportOpen(true)}
            disabled={!rankings || rankings.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export for NCAA
          </CanvasButton>
          <CanvasButton variant="ghost" onClick={() => setIsImportOpen(true)}>
            <Plus className="w-4 h-4" />
            Add External Ranking
          </CanvasButton>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* TABS — Speed Rankings vs Head-to-Head */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasTabs
          tabs={[
            { id: 'rankings', label: 'Speed Rankings' },
            { id: 'head-to-head', label: 'Head-to-Head' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'rankings' | 'head-to-head')}
        />

        {/* Speed Rankings Tab */}
        {activeTab === 'rankings' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <RankingsView onSelectTeam={handleSelectTeam} />
          </motion.div>
        )}

        {/* Head-to-Head Tab */}
        {activeTab === 'head-to-head' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 space-y-6"
          >
            {/* Team and boat class selectors */}
            <div className="flex gap-4">
              <div className="flex-1">
                <RuledHeader>Compare against</RuledHeader>
                <CanvasSelect
                  value={selectedComparison?.opponent || ''}
                  onChange={(value) =>
                    setSelectedComparison((prev) => ({
                      opponent: value,
                      boatClass: prev?.boatClass || boatClasses[0]?.value || '8+',
                    }))
                  }
                  options={[
                    { value: '', label: 'Select a team' },
                    ...(externalTeams?.map((team) => ({
                      value: team.name,
                      label: team.name,
                    })) || []),
                  ]}
                />
              </div>

              <div className="w-48">
                <RuledHeader>Boat Class</RuledHeader>
                <CanvasSelect
                  value={selectedComparison?.boatClass || ''}
                  onChange={(value) =>
                    setSelectedComparison((prev) => ({
                      opponent: prev?.opponent || '',
                      boatClass: value,
                    }))
                  }
                  options={boatClasses.map((bc) => ({
                    value: bc.value,
                    label: bc.label,
                  }))}
                />
              </div>
            </div>

            {/* Head-to-head comparison */}
            {selectedComparison?.opponent ? (
              <HeadToHeadTable
                opponent={selectedComparison.opponent}
                boatClass={selectedComparison.boatClass}
              />
            ) : (
              <CanvasConsoleReadout
                items={[{ label: 'STATUS', value: 'SELECT A TEAM TO COMPARE RACE HISTORY' }]}
              />
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary stats */}
      {/* ============================================ */}
      {rankings && rankings.length > 0 && (
        <motion.div variants={fadeUp}>
          <CanvasConsoleReadout
            items={[
              { label: 'TEAMS TRACKED', value: rankings.length.toString() },
              { label: 'LAST UPDATE', value: new Date().toLocaleDateString() },
              { label: 'STATUS', value: 'ACTIVE' },
            ]}
          />
        </motion.div>
      )}

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Import Modal */}
      <CanvasModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Add External Ranking"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Import ranking data from external race results
          </p>
          {/* Placeholder form - using existing component */}
          <div className="text-xs font-mono text-ink-muted">[IMPORT FORM PLACEHOLDER]</div>
        </div>
      </CanvasModal>

      {/* NCAA Export Dialog - reuse V2 component */}
      <NCAAExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rankings={rankings || []}
      />
    </motion.div>
  );
}

export default CanvasRankingsPage;
