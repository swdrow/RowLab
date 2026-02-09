import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  size?: 'sm' | 'md';
  color?: 'default' | 'success' | 'gold';
}

const colorClasses = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  gold: 'bg-amber-500',
};

export function ProgressBar({
  current,
  target,
  label,
  showPercentage = false,
  showValues = true,
  size = 'md',
  color = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const isComplete = current >= target;

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const barColor = isComplete ? 'bg-green-500' : colorClasses[color];

  return (
    <div className="w-full">
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-txt-secondary">{label}</span>}
          {showValues && (
            <span className="text-xs font-mono text-txt-tertiary">
              {current.toLocaleString()} / {target.toLocaleString()}
              {showPercentage && ` (${percentage}%)`}
            </span>
          )}
        </div>
      )}

      <div className={`w-full ${heightClass} bg-surface-elevated rounded-full overflow-hidden`}>
        <motion.div
          className={`${heightClass} ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
