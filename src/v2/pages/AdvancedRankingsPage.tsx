import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBar,
  Columns,
  Users,
  ShareNetwork,
  Calendar
} from '@phosphor-icons/react';
import {
  BradleyTerryRankings,
  CompositeRankings,
  SideRankings,
  ComparisonGraph,
  ProbabilityMatrix
} from '../components/seat-racing';

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

  const handleAthleteClick = (athleteId: string) => {
    navigate(`/app/coach/athletes/${athleteId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Advanced Rankings</h1>
          <p className="text-txt-secondary mt-1">
            Statistical analysis of athlete performance using Bradley-Terry model and composite factors.
          </p>
        </div>

        <a
          href="/app/coach/seat-racing/matrix-planner"
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          <Calendar size={20} />
          Plan Matrix Session
        </a>
      </div>

      {/* Tabbed content */}
      <Tab.Group onChange={(index) => setActiveTab(TABS[index].id)}>
        <Tab.List className="flex gap-1 bg-surface-secondary p-1 rounded-lg">
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) => `
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1
                ${selected
                  ? 'bg-surface-primary text-txt-primary shadow-sm'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-hover'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Composite Rankings */}
          <Tab.Panel>
            <div className="bg-surface-primary rounded-lg p-6 shadow-sm border border-bdr-primary">
              <CompositeRankings onAthleteClick={handleAthleteClick} />
            </div>
          </Tab.Panel>

          {/* Bradley-Terry Rankings */}
          <Tab.Panel>
            <div className="bg-surface-primary rounded-lg p-6 shadow-sm border border-bdr-primary">
              <BradleyTerryRankings
                onAthleteClick={handleAthleteClick}
                showMethodology={false}
              />
            </div>
          </Tab.Panel>

          {/* Side-Specific Rankings */}
          <Tab.Panel>
            <div className="bg-surface-primary rounded-lg p-6 shadow-sm border border-bdr-primary">
              <SideRankings onAthleteClick={handleAthleteClick} />
            </div>
          </Tab.Panel>

          {/* Comparison Graph */}
          <Tab.Panel>
            <div className="bg-surface-primary rounded-lg p-6 shadow-sm border border-bdr-primary">
              <h3 className="text-lg font-semibold text-txt-primary mb-4">
                Comparison Network
              </h3>
              <p className="text-sm text-txt-secondary mb-4">
                This graph shows which athletes have been compared in seat races.
                Larger nodes indicate more comparisons. Gaps show pairs that haven't raced yet.
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
            <div className="bg-surface-primary rounded-lg p-6 shadow-sm border border-bdr-primary">
              <h3 className="text-lg font-semibold text-txt-primary mb-4">
                Win Probability Matrix
              </h3>
              <p className="text-sm text-txt-secondary mb-4">
                This heatmap shows the predicted probability that the row athlete beats the column athlete,
                based on Bradley-Terry model estimates. Orange indicates higher win probability.
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
    </div>
  );
}

export default AdvancedRankingsPage;
