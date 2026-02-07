import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Search, Upload } from 'lucide-react';
import { SPRING_CONFIG, usePrefersReducedMotion } from '@v2/utils/animations';

type ImportStage = 'parsing' | 'validating' | 'importing' | 'complete';

interface ImportProgressBarProps {
  stage: ImportStage;
  current: number;
  total: number;
}

const STAGE_CONFIG: Record<ImportStage, { label: string; icon: typeof Loader2; color: string }> = {
  parsing: {
    label: 'Parsing CSV file...',
    icon: Loader2,
    color: 'text-interactive-primary',
  },
  validating: {
    label: 'Validating data...',
    icon: Search,
    color: 'text-interactive-primary',
  },
  importing: {
    label: 'Importing athletes...',
    icon: Upload,
    color: 'text-interactive-primary',
  },
  complete: {
    label: 'Import complete',
    icon: CheckCircle2,
    color: 'text-status-success',
  },
};

export function ImportProgressBar({ stage, current, total }: ImportProgressBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const springTransition = prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG;

  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;
  const isIndeterminate = stage === 'parsing' || stage === 'validating';
  const percentage =
    stage === 'complete' ? 100 : total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-4 py-6">
      {/* Icon + label */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center
            ${stage === 'complete' ? 'bg-status-success/20' : 'bg-interactive-primary/10'}`}
        >
          {stage === 'complete' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springTransition}>
              <Icon size={24} className={config.color} />
            </motion.div>
          ) : (
            <Icon size={24} className={`${config.color} animate-spin`} />
          )}
        </div>

        <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto">
        <div className="h-2 bg-bg-surface-elevated rounded-full overflow-hidden">
          {isIndeterminate ? (
            <motion.div
              className="h-full bg-interactive-primary rounded-full w-1/3"
              animate={{
                x: ['-100%', '400%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'easeInOut',
              }}
            />
          ) : (
            <motion.div
              className={`h-full rounded-full ${
                stage === 'complete' ? 'bg-status-success' : 'bg-interactive-primary'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={springTransition}
            />
          )}
        </div>

        {/* Percentage and count */}
        {!isIndeterminate && (
          <div className="flex justify-between mt-2">
            <span className="text-xs text-txt-tertiary">
              {stage === 'complete'
                ? `${total} athletes processed`
                : `Importing ${current} of ${total} athletes...`}
            </span>
            <span className="text-xs text-txt-secondary font-medium">{percentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
