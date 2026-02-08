import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, FileSpreadsheet, HelpCircle } from 'lucide-react';
import { Dialog, Tab } from '@headlessui/react';
import {
  RankingsView,
  RankingImportForm,
  HeadToHeadTable,
  NCAAExportDialog,
} from '../components/rankings';
import {
  useExternalTeams,
  useAddExternalRanking,
  useBoatClassRankings,
} from '../hooks/useTeamRankings';
import { useRegattaKeyboard, getRegattaShortcuts } from '../hooks/useRegattaKeyboard';
import { RankingsSkeleton } from '../features/regatta/components/RankingsSkeleton';
import { OfflineQueueIndicator } from '../features/regatta/components/OfflineQueueIndicator';
import { queryKeys } from '../lib/queryKeys';
import { getBoatClasses } from '../utils/marginCalculations';
import type { ExternalRankingFormData } from '../types/regatta';

export function RankingsPage() {
  const queryClient = useQueryClient();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedBoatClass, setSelectedBoatClass] = useState<string | null>(null);
  const [selectedComparison, setSelectedComparison] = useState<{
    opponent: string;
    boatClass: string;
  } | null>(null);

  const { data: externalTeams } = useExternalTeams();
  const addRanking = useAddExternalRanking();
  const boatClasses = getBoatClasses();
  const { data: rankings } = useBoatClassRankings(selectedBoatClass || undefined);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useRegattaKeyboard({
    onRefresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.rankings.all }),
    onExport: () => setIsExportOpen(true),
    onEscape: () => {
      if (isImportOpen) setIsImportOpen(false);
      if (isExportOpen) setIsExportOpen(false);
    },
  });

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!rankings || rankings.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                     bg-accent-copper text-white rounded-lg
                     hover:bg-accent-copper-hover transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export for NCAA
          </button>
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
            {!rankings ? <RankingsSkeleton /> : <RankingsView onSelectTeam={handleSelectTeam} />}
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

      {/* NCAA Export Dialog */}
      <NCAAExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rankings={rankings || []}
      />

      {/* Keyboard Shortcuts Help */}
      <Dialog open={showHelp} onClose={() => setShowHelp(false)} className="relative z-50">
        <div className="fixed inset-0 bg-ink-deep/80 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-ink-well rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-txt-secondary" />
              <Dialog.Title className="text-lg font-semibold text-txt-primary">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <div className="space-y-2">
              {getRegattaShortcuts({
                hasRefresh: true,
                hasExport: true,
                hasEscape: true,
              })
                .filter((s) => s.available)
                .map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-txt-secondary">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-ink-raised text-txt-primary rounded border border-bdr-default">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-4 py-2 text-sm font-medium
                       bg-accent-primary text-white rounded-lg
                       hover:bg-accent-primary-hover transition-colors"
            >
              Got it
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Offline Queue Indicator */}
      <OfflineQueueIndicator />
    </div>
  );
}

export default RankingsPage;
