/**
 * CanvasErgTestsPage - Erg test data with Canvas design language
 *
 * Canvas design philosophy:
 * - CanvasDataTable for tabular data (NOT generic tables)
 * - CanvasTabs for view switching (Tests/Leaderboard)
 * - ScrambleNumber for ALL numeric values (splits, watts, ranks)
 * - PR indicators with data-excellent color
 * - CSV import modal with Canvas styling
 * - Console readout footer (NOT stats bar)
 * - Monochrome chrome, data-only color
 *
 * Feature parity with V2 ErgTestsPage:
 * - Tests table with filters
 * - Leaderboard tab
 * - CSV import
 * - PR celebration
 * - Keyboard shortcuts
 * - C2 status panel
 */

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Upload, X } from 'lucide-react';
import {
  ScrambleNumber,
  CanvasTabs,
  CanvasDataTable,
  CanvasModal,
  CanvasButton,
  CanvasSelect,
  CanvasConsoleReadout,
  CanvasChamferPanel,
} from '@v2/components/canvas';
import type { ColumnDef } from '@tanstack/react-table';
import { useErgTests } from '@v2/hooks/useErgTests';
import { useAthletes } from '@v2/hooks/useAthletes';
import { usePRCelebration } from '@v2/hooks/usePersonalRecords';
import { useMyC2Status } from '@v2/hooks/useConcept2';
import { ErgTestForm, ErgCSVImportModal, ErgLeaderboard, C2SyncButton } from '@v2/components/erg';
import { PRCelebration } from '@v2/features/gamification/components/PRCelebration';
import { FADE_IN_VARIANTS, SPRING_GENTLE } from '@v2/utils/animations';
import type {
  ErgTest,
  ErgTestFilters as FilterState,
  CreateErgTestInput,
  UpdateErgTestInput,
} from '@v2/types/ergTests';

type ViewTab = 'tests' | 'leaderboard';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS ERG TESTS PAGE
// ============================================

export function CanvasErgTestsPage() {
  // View tab state
  const [activeView, setActiveView] = useState<ViewTab>('tests');

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    testType: 'all',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ErgTest | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // PR celebration state
  const [lastCreatedTestId, setLastCreatedTestId] = useState<string | null>(null);
  const [prTestIds, setPrTestIds] = useState<Set<string>>(new Set());
  const [showPRBanner, setShowPRBanner] = useState(false);

  // Fetch erg tests with filters
  const { tests, isLoading, createTest, isCreating, updateTest, isUpdating, deleteTest } =
    useErgTests(filters);

  // Fetch athletes for form dropdown
  const { athletes } = useAthletes();

  // Check if user has C2 connected (for showing sync button)
  const { isConnected: isC2Connected } = useMyC2Status();

  // PR celebration detection for last created test
  const { data: prData } = usePRCelebration(lastCreatedTestId || '');

  // Show PR banner when PR is detected
  useEffect(() => {
    if (prData && prData.contexts?.some((c) => c.isPR) && lastCreatedTestId) {
      setShowPRBanner(true);
      setPrTestIds((prev) => new Set(prev).add(lastCreatedTestId));

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setShowPRBanner(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [prData, lastCreatedTestId]);

  const handleDismissPR = useCallback(() => {
    setShowPRBanner(false);
  }, []);

  const handleOpenAddModal = () => {
    setEditingTest(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (test: ErgTest) => {
    setEditingTest(test);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingTest(null), 300);
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleImportSuccess = (count: number) => {
    console.log(`Successfully imported ${count} erg tests`);
  };

  const handleSubmit = (data: CreateErgTestInput | UpdateErgTestInput) => {
    if (editingTest) {
      updateTest({ ...data, id: editingTest.id } as any, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    } else {
      createTest(data as CreateErgTestInput, {
        onSuccess: (createdTest) => {
          if (createdTest?.id) {
            setLastCreatedTestId(createdTest.id);
          }
          handleCloseModal();
        },
      });
    }
  };

  const handleDelete = (testId: string) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    const athleteName = test.athlete
      ? `${test.athlete.firstName} ${test.athlete.lastName}`
      : 'this athlete';
    const testDate = new Date(test.testDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (confirm(`Delete ${test.testType} test for ${athleteName} on ${testDate}?`)) {
      deleteTest(testId);
    }
  };

  // Calculate stats
  const totalTests = tests.length;
  const uniqueAthletes = new Set(tests.map((t) => t.athleteId)).size;
  const avgSplit =
    tests.length > 0 ? tests.reduce((sum, t) => sum + (t.splitSeconds || 0), 0) / tests.length : 0;
  const avgSplitFormatted =
    avgSplit > 0
      ? `${Math.floor(avgSplit / 60)}:${(avgSplit % 60).toFixed(1).padStart(4, '0')}`
      : '—';

  // Prepare table columns and data
  type TableRow = {
    id: string;
    athlete: string;
    testType: string;
    date: string;
    time: JSX.Element;
    split: JSX.Element;
    watts: JSX.Element;
    actions: JSX.Element;
  };

  const columns: ColumnDef<TableRow>[] = [
    {
      accessorKey: 'athlete',
      header: 'ATHLETE',
      cell: (info) => <span className="text-ink-bright">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'testType',
      header: 'TEST',
      cell: (info) => (
        <span className="font-mono text-xs text-ink-secondary uppercase">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      cell: (info) => (
        <span className="font-mono text-xs text-ink-secondary">{info.getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'time',
      header: 'TIME',
      cell: (info) => info.getValue() as JSX.Element,
    },
    {
      accessorKey: 'split',
      header: 'SPLIT',
      cell: (info) => info.getValue() as JSX.Element,
    },
    {
      accessorKey: 'watts',
      header: 'WATTS',
      cell: (info) => info.getValue() as JSX.Element,
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: (info) => info.getValue() as JSX.Element,
      enableSorting: false,
    },
  ];

  const tableData: TableRow[] = tests.map((test) => {
    const isPR = prTestIds.has(test.id);
    const timeFormatted = test.timeSeconds
      ? `${Math.floor(test.timeSeconds / 60)}:${(test.timeSeconds % 60).toFixed(1).padStart(4, '0')}`
      : '—';
    const splitFormatted = test.splitSeconds
      ? `${Math.floor(test.splitSeconds / 60)}:${(test.splitSeconds % 60).toFixed(1).padStart(4, '0')}`
      : '—';

    return {
      id: test.id,
      athlete: test.athlete ? `${test.athlete.firstName} ${test.athlete.lastName}` : 'Unknown',
      testType: test.testType,
      date: new Date(test.testDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: (
        <span
          className={`font-mono ${isPR ? 'text-data-excellent font-semibold' : 'text-ink-bright'}`}
        >
          {timeFormatted}
          {isPR && <span className="ml-2 text-[10px] text-data-excellent">PR</span>}
        </span>
      ),
      split: <span className="font-mono text-ink-bright">{splitFormatted}</span>,
      watts: (
        <span className="font-mono text-data-good">
          <ScrambleNumber value={test.watts || 0} />
        </span>
      ),
      actions: (
        <div className="flex items-center gap-2">
          <CanvasButton variant="ghost" size="sm" onClick={() => handleOpenEditModal(test)}>
            EDIT
          </CanvasButton>
          <CanvasButton variant="ghost" size="sm" onClick={() => handleDelete(test.id)}>
            DEL
          </CanvasButton>
        </div>
      ),
    };
  });

  return (
    <div className="h-full flex flex-col bg-void">
      {/* PR Celebration Banner */}
      <AnimatePresence>
        {showPRBanner && prData && (
          <motion.div
            variants={FADE_IN_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={SPRING_GENTLE}
            className="flex-shrink-0 px-6 py-3 border-b border-data-excellent/30 bg-data-excellent/10 relative"
          >
            <div className="max-w-2xl mx-auto">
              <PRCelebration data={prData} compact />
            </div>
            <button
              onClick={handleDismissPR}
              className="absolute top-3 right-4 p-1 text-ink-muted hover:text-ink-bright transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header — text against void */}
      <div className="px-4 lg:px-6 pt-8 pb-6 border-b border-ink-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                PERFORMANCE
              </p>
              <h1 className="text-2xl lg:text-3xl font-semibold text-ink-bright tracking-tight">
                Erg Tests
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {isC2Connected && <C2SyncButton mode="user" variant="button" size="md" />}

              <CanvasButton
                variant="secondary"
                onClick={handleOpenImportModal}
                className="flex-1 lg:flex-none"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">IMPORT CSV</span>
                <span className="sm:hidden">IMPORT</span>
              </CanvasButton>

              <CanvasButton
                variant="primary"
                onClick={handleOpenAddModal}
                className="flex-1 lg:flex-none"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">ADD TEST</span>
                <span className="sm:hidden">ADD</span>
              </CanvasButton>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-ink-border/30 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <CanvasTabs
            tabs={[
              { id: 'tests', label: 'ALL TESTS' },
              { id: 'leaderboard', label: 'LEADERBOARD' },
            ]}
            activeTab={activeView}
            onChange={(id) => setActiveView(id as ViewTab)}
          />
        </div>
      </div>

      {/* Filters (only show for tests tab) */}
      {activeView === 'tests' && (
        <div className="px-4 lg:px-6 py-3 border-b border-ink-border/30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
            <CanvasSelect
              value={filters.testType || 'all'}
              onChange={(value) =>
                setFilters({ ...filters, testType: value === 'all' ? 'all' : (value as any) })
              }
              options={[
                { value: 'all', label: 'ALL TESTS' },
                { value: '2k', label: '2K' },
                { value: '6k', label: '6K' },
                { value: '500m', label: '500M' },
                { value: '1k', label: '1K' },
                { value: '5k', label: '5K' },
              ]}
              label="Test Type"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <AnimatePresence mode="wait">
            {activeView === 'tests' ? (
              <motion.div
                key="tests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div key={i} variants={fadeUp}>
                        <div className="h-12 bg-ink-well/30 animate-pulse" />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : totalTests === 0 ? (
                  <div className="py-12 text-center">
                    <CanvasConsoleReadout
                      items={[{ label: 'STATUS', value: 'NO ERG TEST DATA' }]}
                    />
                  </div>
                ) : (
                  <CanvasDataTable
                    data={tableData}
                    columns={columns}
                    virtualized={true}
                    rowHeight={48}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CanvasChamferPanel className="p-6">
                  <ErgLeaderboard />
                </CanvasChamferPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-ink-border/30 px-4 lg:px-6 py-3 bg-ink-well/20">
        <div className="max-w-7xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'TESTS', value: totalTests.toString() },
              { label: 'ATHLETES', value: uniqueAthletes.toString() },
              { label: 'AVG SPLIT', value: avgSplitFormatted },
            ]}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <CanvasModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTest ? 'EDIT ERG TEST' : 'ADD ERG TEST'}
      >
        <ErgTestForm
          initialData={editingTest || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          athletes={athletes}
          isSubmitting={isCreating || isUpdating}
        />
      </CanvasModal>

      {/* CSV Import Modal */}
      <ErgCSVImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default CanvasErgTestsPage;
