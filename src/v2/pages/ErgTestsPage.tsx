import { useState } from 'react';
import { useErgTests } from '@v2/hooks/useErgTests';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useRequireAuth } from '../../hooks/useAuth';
import { CrudModal } from '@v2/components/common/CrudModal';
import {
  ErgTestFilters,
  ErgTestForm,
  ErgTestsTable,
} from '@v2/components/erg';
import { Plus } from 'lucide-react';
import type { ErgTest, ErgTestFilters as FilterState, CreateErgTestInput, UpdateErgTestInput } from '@v2/types/ergTests';

/**
 * Main Erg Tests page with table, filters, and CRUD operations
 */
export function ErgTestsPage() {
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    testType: 'all',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ErgTest | null>(null);

  // Auth - redirects to login if not authenticated
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Fetch erg tests with filters
  const {
    tests,
    isLoading,
    createTest,
    isCreating,
    updateTest,
    isUpdating,
    deleteTest,
    isDeleting,
  } = useErgTests(filters);

  // Fetch athletes for form dropdown
  const { athletes } = useAthletes();

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
    // Delay clearing editing test to allow modal close animation
    setTimeout(() => setEditingTest(null), 300);
  };

  const handleSubmit = (data: CreateErgTestInput | UpdateErgTestInput) => {
    if (editingTest) {
      // Update existing test
      updateTest(
        { ...data, id: editingTest.id } as any,
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
    } else {
      // Create new test
      createTest(data as CreateErgTestInput, {
        onSuccess: () => {
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

  const handleRowClick = (test: ErgTest) => {
    // For now, just open edit modal
    // In 07-03, this will open athlete erg history panel
    handleOpenEditModal(test);
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
            <h1 className="text-2xl font-bold text-txt-primary">Erg Tests</h1>
            <p className="text-sm text-txt-tertiary mt-1">
              {tests.length} {tests.length === 1 ? 'test' : 'tests'}
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors"
          >
            <Plus size={18} />
            Add Test
          </button>
        </div>

        {/* Filters */}
        <ErgTestFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ErgTestsTable
          tests={tests}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Add/Edit Modal */}
      <CrudModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTest ? 'Edit Erg Test' : 'Add Erg Test'}
      >
        <ErgTestForm
          initialData={editingTest || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          athletes={athletes}
          isSubmitting={isCreating || isUpdating}
        />
      </CrudModal>
    </div>
  );
}

export default ErgTestsPage;
