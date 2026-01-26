import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { MatrixPlanner } from '../components/seat-racing';
import type { SwapSchedule } from '../types/advancedRanking';

export function MatrixPlannerPage() {
  const navigate = useNavigate();
  const [generatedSchedule, setGeneratedSchedule] = useState<SwapSchedule | null>(null);

  const handleScheduleGenerated = (schedule: SwapSchedule) => {
    setGeneratedSchedule(schedule);
    // Could save to local storage or create a session here
  };

  const handleClose = () => {
    navigate('/app/coach/seat-racing');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-txt-secondary hover:text-txt-primary rounded-lg hover:bg-surface-hover"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Matrix Session Planner</h1>
          <p className="text-txt-secondary mt-1">
            Generate optimal swap schedules for seat racing using Latin Square designs.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How it works</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal ml-4">
          <li>Select the athletes you want to include in the seat race</li>
          <li>Choose the boat class (determines how many athletes per boat)</li>
          <li>Generate an optimal swap schedule that maximizes comparison coverage</li>
          <li>Review the schedule in grid or timeline view</li>
          <li>Use the schedule to run your seat race session</li>
        </ol>
      </div>

      {/* Planner */}
      <div className="bg-surface-primary rounded-lg shadow-sm border border-bdr-primary overflow-hidden">
        <MatrixPlanner
          onScheduleGenerated={handleScheduleGenerated}
          onClose={handleClose}
        />
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BenefitCard
          title="Optimal Coverage"
          description="Ensures all athletes are compared as evenly as possible, maximizing ranking accuracy."
        />
        <BenefitCard
          title="Fewer Pieces Needed"
          description="Latin Square design requires fewer pieces than random swaps to achieve the same comparison coverage."
        />
        <BenefitCard
          title="Statistical Validity"
          description="Balanced designs produce more reliable rankings with narrower confidence intervals."
        />
      </div>
    </div>
  );
}

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-surface-secondary rounded-lg p-4">
      <h4 className="font-medium text-txt-primary mb-1">{title}</h4>
      <p className="text-sm text-txt-secondary">{description}</p>
    </div>
  );
}

export default MatrixPlannerPage;
