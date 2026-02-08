import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChartBar, Columns, Users, ShareNetwork, Calendar } from '@phosphor-icons/react';
import {
  BradleyTerryRankings,
  CompositeRankings,
  SideRankings,
  ComparisonGraph,
  ProbabilityMatrix,
} from '../components/seat-racing';
import { RankingsTableSkeleton } from '@v2/features/seat-racing/components/SeatRacingSkeleton';
import { FADE_IN_VARIANTS } from '@v2/utils/animations';

const TABS = [
  { id: 'composite', label: 'Composite', icon: ChartBar },
  { id: 'bradley-terry', label: 'Bradley-Terry', icon: Columns },
  { id: 'by-side', label: 'By Side', icon: Users },
  { id: 'comparison-graph', label: 'Comparisons', icon: ShareNetwork },
  { id: 'probability', label: 'Win Probability', icon: Calendar },
];

export function AdvancedRankingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('composite');
  const [isLoading] = useState(false); // Would come from data hook

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/app/coach/athletes/${athleteId}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              ADVANCED ANALYTICS
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Rankings
            </h1>
            <p className="text-sm text-ink-secondary mt-2">
              Bradley-Terry model rankings and statistical analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/app/coach/seat-racing/matrix-planner"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-all duration-150"
            >
              <Calendar size={20} />
              Plan Matrix Session
            </a>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="px-6">
        {isLoading ? (
          <RankingsTableSkeleton />
        ) : (
          <motion.div variants={FADE_IN_VARIANTS} initial="hidden" animate="visible">
            <Tab.Group onChange={(index) => setActiveTab(TABS[index].id)}>
              <Tab.List className="flex gap-1 bg-ink-raised p-1 rounded-lg border border-ink-border mb-6">
                {TABS.map((tab) => (
                  <Tab
                    key={tab.id}
                    className={({ selected }) => `
                      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 flex-1 border-b-2 -mb-px
                      ${
                        selected
                          ? 'border-accent-copper text-ink-bright bg-ink-hover'
                          : 'border-transparent text-ink-secondary hover:text-ink-body hover:border-ink-border'
                      }
                    `}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels>
                {/* Composite Rankings */}
                <Tab.Panel>
                  <div className="bg-ink-raised rounded-xl p-6 border border-ink-border">
                    <CompositeRankings onAthleteClick={handleAthleteClick} />
                  </div>
                </Tab.Panel>

                {/* Bradley-Terry Rankings */}
                <Tab.Panel>
                  <div className="bg-ink-raised rounded-xl p-6 border border-ink-border">
                    <BradleyTerryRankings
                      onAthleteClick={handleAthleteClick}
                      showMethodology={false}
                    />
                  </div>
                </Tab.Panel>

                {/* Side-Specific Rankings */}
                <Tab.Panel>
                  <div className="bg-ink-raised rounded-xl p-6 border border-ink-border">
                    <SideRankings onAthleteClick={handleAthleteClick} />
                  </div>
                </Tab.Panel>

                {/* Comparison Graph */}
                <Tab.Panel>
                  <div className="bg-ink-raised rounded-xl p-6 border border-ink-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-copper">
                        Comparison Network
                      </h3>
                    </div>
                    <p className="text-sm text-ink-secondary mb-4">
                      This graph shows which athletes have been compared in seat races. Larger nodes
                      indicate more comparisons. Gaps show pairs that haven't raced yet.
                    </p>
                    <ComparisonGraph
                      height="500px"
                      showGaps={true}
                      onNodeClick={handleAthleteClick}
                    />
                  </div>
                </Tab.Panel>

                {/* Probability Matrix */}
                <Tab.Panel>
                  <div className="bg-ink-raised rounded-xl p-6 border border-ink-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-copper">
                        Win Probability Matrix
                      </h3>
                    </div>
                    <p className="text-sm text-ink-secondary mb-4">
                      This heatmap shows the predicted probability that the row athlete beats the
                      column athlete, based on Bradley-Terry model estimates. Copper indicates
                      higher win probability.
                    </p>
                    <ProbabilityMatrix
                      maxSize={12}
                      onCellClick={(athlete1, athlete2, prob) => {
                        console.log(`P(${athlete1} beats ${athlete2}) = ${prob}`);
                      }}
                    />
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AdvancedRankingsPage;
