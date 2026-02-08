import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, Tab } from '@headlessui/react';
import { RankingsView, RankingImportForm, HeadToHeadTable } from '../components/rankings';
import { useExternalTeams, useAddExternalRanking } from '../hooks/useTeamRankings';
import { getBoatClasses } from '../utils/marginCalculations';
import type { ExternalRankingFormData } from '../types/regatta';

export function RankingsPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<{
    opponent: string;
    boatClass: string;
  } | null>(null);

  const { data: externalTeams } = useExternalTeams();
  const addRanking = useAddExternalRanking();
  const boatClasses = getBoatClasses();

  const handleSelectTeam = (teamName: string, boatClass: string) => {
    setSelectedComparison({ opponent: teamName, boatClass });
  };

  const handleImport = (data: ExternalRankingFormData) => {
    addRanking.mutate(data, {
      onSuccess: () => {
        setIsImportOpen(false);
      },
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-txt-primary">Team Rankings</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Compare your team's speed against competitors
          </p>
        </div>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                   bg-ink-raised text-txt-primary rounded-lg
                   hover:bg-ink-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add External Ranking
        </button>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex gap-1 border-b border-bdr-default mb-6">
          <Tab
            className={({ selected }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                selected
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-txt-secondary hover:text-txt-primary'
              }`
            }
          >
            Speed Rankings
          </Tab>
          <Tab
            className={({ selected }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                selected
                  ? 'border-interactive-primary text-interactive-primary'
                  : 'border-transparent text-txt-secondary hover:text-txt-primary'
              }`
            }
          >
            Head-to-Head
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Speed Rankings */}
          <Tab.Panel>
            <RankingsView onSelectTeam={handleSelectTeam} />
          </Tab.Panel>

          {/* Head-to-Head */}
          <Tab.Panel>
            <div className="space-y-6">
              {/* Team and boat class selectors */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    Compare against
                  </label>
                  <select
                    value={selectedComparison?.opponent || ''}
                    onChange={(e) =>
                      setSelectedComparison((prev) => ({
                        opponent: e.target.value,
                        boatClass: prev?.boatClass || boatClasses[0]?.value || '8+',
                      }))
                    }
                    className="w-full px-3 py-2 bg-ink-well border border-bdr-default rounded-lg
                             text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                  >
                    <option value="">Select a team</option>
                    {externalTeams?.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-48">
                  <label className="block text-sm font-medium text-txt-secondary mb-1">
                    Boat Class
                  </label>
                  <select
                    value={selectedComparison?.boatClass || ''}
                    onChange={(e) =>
                      setSelectedComparison((prev) => ({
                        opponent: prev?.opponent || '',
                        boatClass: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-ink-well border border-bdr-default rounded-lg
                             text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                  >
                    {boatClasses.map((bc) => (
                      <option key={bc.value} value={bc.value}>
                        {bc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Head-to-head comparison */}
              {selectedComparison?.opponent ? (
                <HeadToHeadTable
                  opponent={selectedComparison.opponent}
                  boatClass={selectedComparison.boatClass}
                />
              ) : (
                <div className="text-center py-12 text-txt-secondary">
                  <p>Select a team to compare your race history</p>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Import Modal */}
      <Dialog open={isImportOpen} onClose={() => setIsImportOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-ink-deep/80 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-ink-well rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-txt-primary mb-4">
              Add External Ranking
            </Dialog.Title>
            <RankingImportForm
              onSubmit={handleImport}
              onCancel={() => setIsImportOpen(false)}
              isSubmitting={addRanking.isPending}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default RankingsPage;
