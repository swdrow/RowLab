/**
 * CanvasAdvancedRankingsPage - Canvas redesign of the Advanced Rankings page
 *
 * Canvas Design System Features:
 * - Canvas header with category/title pattern
 * - CanvasTabs with ruled line active indicator (manual Tab implementation)
 * - CanvasButton for Plan Matrix Session action
 * - CanvasChamferPanel wrapping each visualization
 * - CanvasConsoleReadout for bottom status bar
 * - Stagger/fadeUp motion variants
 * - NO rounded corners, NO card wrappers, NO badge pills
 *
 * WRAPS existing V2 sub-components (BradleyTerryRankings, CompositeRankings,
 * SideRankings, ComparisonGraph, ProbabilityMatrix) in Canvas containers.
 */

import { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BradleyTerryRankings,
  CompositeRankings,
  SideRankings,
  ComparisonGraph,
  ProbabilityMatrix,
} from '../../components/seat-racing';
import { SPRING_CONFIG } from '@v2/utils/animations';
import {
  RuledHeader,
  CanvasChamferPanel,
  CanvasButton,
  CanvasConsoleReadout,
} from '@v2/components/canvas';

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

// ============================================
// TAB CONFIG
// ============================================

const TABS = [
  { id: 'composite', label: 'Composite' },
  { id: 'bradley-terry', label: 'Bradley-Terry' },
  { id: 'by-side', label: 'By Side' },
  { id: 'comparison-graph', label: 'Comparisons' },
  { id: 'probability', label: 'Win Probability' },
] as const;

// ============================================
// CANVAS ADVANCED RANKINGS PAGE
// ============================================

export function CanvasAdvancedRankingsPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/app/coach/athletes/${athleteId}`);
  };

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-shrink-0 px-6 pt-8 pb-6"
      >
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
              Analytics
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
              Advanced Rankings
            </h1>
            <p className="text-sm font-mono text-ink-secondary mt-2">
              Bradley-Terry model rankings and statistical analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/coach/seat-racing/matrix-planner">
              <CanvasButton variant="primary" size="md">
                Plan Matrix Session
              </CanvasButton>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* TABS */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="flex-shrink-0 border-b border-ink-border px-6">
            <Tab.List className="flex gap-6">
              {TABS.map((tab) => (
                <Tab key={tab.id} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`
                        relative px-1 py-3 text-sm font-mono uppercase tracking-wider transition-colors
                        ${selected ? 'text-ink-bright' : 'text-ink-secondary hover:text-ink-bright'}
                      `}
                    >
                      {tab.label}
                      {selected && (
                        <motion.div
                          layoutId="advRankingsActiveTab"
                          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-data-excellent via-ink-bright to-data-excellent"
                          transition={SPRING_CONFIG}
                        />
                      )}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          {/* ============================================ */}
          {/* TAB PANELS */}
          {/* ============================================ */}
          <Tab.Panels className="flex-1 overflow-y-auto">
            {/* Composite Rankings */}
            <Tab.Panel className="p-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <CanvasChamferPanel className="p-6">
                  <CompositeRankings onAthleteClick={handleAthleteClick} />
                </CanvasChamferPanel>
              </motion.div>
            </Tab.Panel>

            {/* Bradley-Terry Rankings */}
            <Tab.Panel className="p-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <CanvasChamferPanel className="p-6">
                  <BradleyTerryRankings
                    onAthleteClick={handleAthleteClick}
                    showMethodology={false}
                  />
                </CanvasChamferPanel>
              </motion.div>
            </Tab.Panel>

            {/* Side-Specific Rankings */}
            <Tab.Panel className="p-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <CanvasChamferPanel className="p-6">
                  <SideRankings onAthleteClick={handleAthleteClick} />
                </CanvasChamferPanel>
              </motion.div>
            </Tab.Panel>

            {/* Comparison Graph */}
            <Tab.Panel className="p-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <RuledHeader>Comparison Network</RuledHeader>
                <CanvasChamferPanel className="p-6">
                  <p className="text-sm text-ink-secondary mb-4">
                    This graph shows which athletes have been compared in seat races. Larger nodes
                    indicate more comparisons. Gaps show pairs that haven't raced yet.
                  </p>
                  <ComparisonGraph
                    height="500px"
                    showGaps={true}
                    onNodeClick={handleAthleteClick}
                  />
                </CanvasChamferPanel>
              </motion.div>
            </Tab.Panel>

            {/* Probability Matrix */}
            <Tab.Panel className="p-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <RuledHeader>Win Probability Matrix</RuledHeader>
                <CanvasChamferPanel className="p-6">
                  <p className="text-sm text-ink-secondary mb-4">
                    Predicted probability that the row athlete beats the column athlete, based on
                    Bradley-Terry model estimates.
                  </p>
                  <ProbabilityMatrix
                    maxSize={12}
                    onCellClick={(athlete1, athlete2, prob) => {
                      console.log(`P(${athlete1} beats ${athlete2}) = ${prob}`);
                    }}
                  />
                </CanvasChamferPanel>
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* ============================================ */}
      {/* CONSOLE READOUT */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-ink-border px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'MODEL', value: 'BRADLEY-TERRY' },
            { label: 'VIEW', value: (TABS[selectedTab]?.label ?? 'COMPOSITE').toUpperCase() },
            { label: 'STATUS', value: 'READY' },
          ]}
        />
      </div>
    </div>
  );
}

export default CanvasAdvancedRankingsPage;
