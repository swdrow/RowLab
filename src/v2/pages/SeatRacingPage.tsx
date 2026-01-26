import { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, X, BarChart3, Calendar, Share2, Beaker } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAthleteRatings, useRecalculateRatings } from '@v2/hooks/useAthleteRatings';
import { useSeatRaceSessions } from '@v2/hooks/useSeatRaceSessions';
import { useRequireAuth } from '../../hooks/useAuth';
import {
  RankingsChart,
  RankingsTable,
  SessionList,
  SessionDetail,
  SessionWizard,
} from '@v2/components/seat-racing';
import type { Side } from '@v2/types/seatRacing';

/**
 * FeatureCard Component
 *
 * Clickable card that links to an advanced analytics feature
 */
interface FeatureCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ to, icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className="block p-4 bg-bg-surface rounded-lg border border-bdr-default hover:border-interactive-primary hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-interactive-primary/10 rounded-lg group-hover:bg-interactive-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-interactive-primary" />
        </div>
        <div>
          <h3 className="font-medium text-txt-primary group-hover:text-interactive-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-txt-secondary mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}

/**
 * SeatRacingPage Component
 *
 * Main page for seat racing functionality with tabs:
 * - Rankings: ELO chart and sortable table with side filtering
 * - Sessions: List of past seat race sessions
 *
 * Features:
 * - New Session button opens wizard modal
 * - Session list items open detail slide-out panel
 * - Rankings include side filter buttons (All/Port/Starboard)
 * - Responsive layout for mobile
 */
export function SeatRacingPage() {
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0);

  // Side filter state (for Rankings tab)
  const [sideFilter, setSideFilter] = useState<'all' | Side>('all');

  // Modal/panel state
  const [showWizard, setShowWizard] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Auth - redirects to login if not authenticated
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Data hooks
  const { ratings, isLoading: isLoadingRatings } = useAthleteRatings({
    ratingType: 'seat_race_elo',
    side: sideFilter === 'all' ? undefined : sideFilter,
  });
  const { sessions, isLoading: isLoadingSessions } = useSeatRaceSessions();
  const { recalculate, isRecalculating } = useRecalculateRatings();

  const handleOpenWizard = () => {
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseDetail = () => {
    setSelectedSessionId(null);
  };

  const handleWizardSuccess = () => {
    handleCloseWizard();
    // Switch to Sessions tab to see the new session
    setSelectedTab(1);
  };

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-default">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-default">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-bdr-default bg-bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary">Seat Racing</h1>
            <p className="text-sm text-txt-tertiary mt-1">
              ELO rankings and session history
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/app/coach/seat-racing/advanced-rankings"
              className="px-4 py-2 bg-bg-subtle text-txt-primary rounded-md hover:bg-bg-hover transition-colors text-sm font-medium"
            >
              Advanced Rankings
            </a>
            <a
              href="/app/coach/seat-racing/matrix-planner"
              className="px-4 py-2 bg-bg-subtle text-txt-primary rounded-md hover:bg-bg-hover transition-colors text-sm font-medium"
            >
              Matrix Planner
            </a>
            <button
              onClick={handleOpenWizard}
              className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-button-primary-text rounded-md hover:bg-interactive-primary-hover transition-colors"
            >
              <Plus size={18} />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          {/* Tab list */}
          <div className="flex-shrink-0 border-b border-bdr-default bg-bg-surface px-6">
            <Tab.List className="flex gap-6">
              <Tab as={Fragment}>
                {({ selected }) => (
                  <button
                    className={`
                      px-1 py-3 text-sm font-medium border-b-2 transition-colors
                      ${
                        selected
                          ? 'border-interactive-primary text-interactive-primary'
                          : 'border-transparent text-txt-secondary hover:text-txt-primary'
                      }
                    `}
                  >
                    Rankings
                  </button>
                )}
              </Tab>
              <Tab as={Fragment}>
                {({ selected }) => (
                  <button
                    className={`
                      px-1 py-3 text-sm font-medium border-b-2 transition-colors
                      ${
                        selected
                          ? 'border-interactive-primary text-interactive-primary'
                          : 'border-transparent text-txt-secondary hover:text-txt-primary'
                      }
                    `}
                  >
                    Sessions
                  </button>
                )}
              </Tab>
            </Tab.List>
          </div>

          {/* Tab panels */}
          <Tab.Panels className="flex-1 overflow-hidden">
            {/* Rankings tab */}
            <Tab.Panel className="h-full flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-6 py-4 border-b border-bdr-default bg-bg-surface">
                {/* Side filter buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-txt-secondary mr-2">
                    Filter:
                  </span>
                  <button
                    onClick={() => setSideFilter('all')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${
                        sideFilter === 'all'
                          ? 'bg-interactive-primary text-button-primary-text'
                          : 'bg-bg-subtle text-txt-secondary hover:bg-bg-hover'
                      }
                    `}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSideFilter('Port')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${
                        sideFilter === 'Port'
                          ? 'bg-red-500 text-white'
                          : 'bg-bg-subtle text-txt-secondary hover:bg-red-500/10'
                      }
                    `}
                  >
                    Port
                  </button>
                  <button
                    onClick={() => setSideFilter('Starboard')}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      ${
                        sideFilter === 'Starboard'
                          ? 'bg-green-500 text-white'
                          : 'bg-bg-subtle text-txt-secondary hover:bg-green-500/10'
                      }
                    `}
                  >
                    Starboard
                  </button>
                </div>
              </div>

              {/* Rankings content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Chart */}
                  <div className="bg-bg-surface border border-bdr-default rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-txt-primary mb-4">
                      ELO Rating Distribution
                    </h2>
                    <RankingsChart ratings={ratings} />
                  </div>

                  {/* Table */}
                  <div className="bg-bg-surface border border-bdr-default rounded-lg overflow-hidden">
                    <RankingsTable
                      ratings={ratings}
                      isLoading={isLoadingRatings}
                      onRecalculate={recalculate}
                    />
                  </div>

                  {/* Advanced Analytics Section */}
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-txt-primary mb-4">
                      Advanced Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FeatureCard
                        to="/app/coach/seat-racing/advanced-rankings"
                        icon={BarChart3}
                        title="Advanced Rankings"
                        description="Bradley-Terry model, composite rankings, and comparison graphs"
                      />
                      <FeatureCard
                        to="/app/coach/seat-racing/matrix-planner"
                        icon={Calendar}
                        title="Matrix Planner"
                        description="Generate optimal swap schedules for seat racing sessions"
                      />
                      <FeatureCard
                        to="/app/coach/seat-racing/advanced-rankings#comparison-graph"
                        icon={Share2}
                        title="Comparison Graph"
                        description="Visualize which athletes have been compared"
                      />
                      <FeatureCard
                        to="/app/coach/seat-racing/advanced-rankings#probability"
                        icon={Beaker}
                        title="Win Probability"
                        description="Heatmap of predicted head-to-head outcomes"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Sessions tab */}
            <Tab.Panel className="h-full overflow-hidden">
              <SessionList
                sessions={sessions}
                isLoading={isLoadingSessions}
                onSessionClick={handleSessionClick}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Wizard Modal */}
      <Transition appear show={showWizard} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseWizard}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal panel */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-card-bg border border-bdr-primary shadow-xl transition-all">
                  {/* Close button */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={handleCloseWizard}
                      className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
                      aria-label="Close"
                    >
                      <X size={20} className="text-txt-secondary" />
                    </button>
                  </div>

                  {/* Wizard */}
                  <SessionWizard
                    onComplete={handleWizardSuccess}
                    onCancel={handleCloseWizard}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Session Detail Slide-out Panel */}
      <Transition appear show={!!selectedSessionId} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseDetail}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          {/* Slide-out panel */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                    <div className="flex h-full flex-col bg-bg-surface border-l border-bdr-default shadow-xl">
                      {selectedSessionId && (
                        <SessionDetail
                          sessionId={selectedSessionId}
                          onClose={handleCloseDetail}
                          onDelete={handleCloseDetail}
                        />
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default SeatRacingPage;
