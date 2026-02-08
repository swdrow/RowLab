import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { MatrixPlanner } from '../components/seat-racing';
import { FADE_IN_VARIANTS } from '@v2/utils/animations';
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
    <div className="h-full flex flex-col overflow-hidden bg-ink-default">
      {/* Compact copper workspace toolbar */}
      <div className="relative px-4 py-3 bg-ink-raised border-b border-ink-border flex-shrink-0">
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-ink-secondary hover:text-ink-bright rounded-lg hover:bg-ink-hover transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper">
              MATRIX PLANNER
            </span>
          </div>
        </div>
      </div>

      {/* Workspace content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          variants={FADE_IN_VARIANTS}
          initial="hidden"
          animate="visible"
          className="p-6 space-y-6"
        >
          {/* Planner */}
          <div className="bg-ink-raised rounded-lg border border-ink-border overflow-hidden">
            <MatrixPlanner onScheduleGenerated={handleScheduleGenerated} onClose={handleClose} />
          </div>

          {/* Benefits section with copper accents */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-copper">
                Benefits
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-accent-copper/20 to-transparent" />
            </div>
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
        </motion.div>
      </div>
    </div>
  );
}

function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-ink-raised rounded-lg p-4 border border-ink-border">
      <h4 className="font-medium text-ink-bright mb-1">{title}</h4>
      <p className="text-sm text-ink-secondary">{description}</p>
    </div>
  );
}

export default MatrixPlannerPage;
