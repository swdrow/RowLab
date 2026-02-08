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
  const [selectedBoatClass] = useState<string | null>(null);
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
    onRefresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.teamRankings.all }),
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
    <div className="max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              Competitive Analysis
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Team Rankings
            </h1>
            <p className="text-sm text-ink-secondary mt-2">
              Compare your team's speed against competitors
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExportOpen(true)}
              disabled={!rankings || rankings.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                       bg-gradient-to-b from-accent-copper to-accent-copper-hover
                       text-white rounded-xl
                       shadow-glow-copper hover:shadow-glow-copper-lg
                       hover:-translate-y-px active:translate-y-0
                       transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export for NCAA
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                       text-ink-primary rounded-xl border border-ink-border
                       hover:bg-ink-hover hover:border-accent-copper/20
                       transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Add External Ranking
            </button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex gap-1 mb-8 border-b border-ink-border">
            <Tab
              className={({ selected }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                  selected
                    ? 'border-accent-copper text-ink-bright'
                    : 'border-transparent text-ink-secondary hover:text-ink-body hover:border-ink-border'
                }`
              }
            >
              Speed Rankings
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                  selected
                    ? 'border-accent-copper text-ink-bright'
                    : 'border-transparent text-ink-secondary hover:text-ink-body hover:border-ink-border'
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
                    <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-[0.1em] mb-2">
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
                      className="w-full px-4 py-2.5 bg-ink-well border border-white/[0.08] rounded-xl
                             text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30
                             focus:border-accent-primary/50 transition-all"
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
                    <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-[0.1em] mb-2">
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
                      className="w-full px-4 py-2.5 bg-ink-well border border-white/[0.08] rounded-xl
                             text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30
                             focus:border-accent-primary/50 transition-all"
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
                  <div className="relative text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/[0.02] to-transparent pointer-events-none" />
                    <p className="text-ink-secondary">Select a team to compare your race history</p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      {/* end px-6 wrapper */}

      {/* Import Modal */}
      <Dialog open={isImportOpen} onClose={() => setIsImportOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-md rounded-2xl shadow-2xl p-6
                                   bg-ink-raised border border-white/[0.08]"
          >
            <Dialog.Title className="text-lg font-display font-semibold text-ink-bright mb-4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            className="w-full max-w-md rounded-2xl shadow-2xl p-6
                                   bg-ink-raised border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-ink-secondary" />
              <Dialog.Title className="text-lg font-display font-semibold text-ink-bright">
                Keyboard Shortcuts
              </Dialog.Title>
            </div>
            <div className="space-y-1">
              {getRegattaShortcuts({
                hasRefresh: true,
                hasExport: true,
                hasEscape: true,
              })
                .filter((s) => s.available)
                .map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="text-sm text-ink-body">{shortcut.description}</span>
                    <kbd className="px-2.5 py-1 text-xs font-mono bg-ink-deep text-ink-primary rounded-lg border border-white/[0.08]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full px-4 py-2.5 text-sm font-medium
                       bg-gradient-to-b from-accent-primary to-accent-primary/90
                       text-white rounded-xl shadow-glow-blue
                       hover:shadow-glow-blue-lg transition-all duration-150"
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
