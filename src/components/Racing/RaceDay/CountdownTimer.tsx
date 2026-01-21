import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  /** Target time for countdown (ISO string or timestamp) */
  targetTime?: string | number | null;
  /** Label for the timer */
  label?: string;
  /** Whether to show controls */
  showControls?: boolean;
  /** Callback when timer reaches zero */
  onComplete?: () => void;
  /** Callback on tick (every second) */
  onTick?: (remaining: number) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  theme?: 'default' | 'warning' | 'danger';
}

/**
 * CountdownTimer - Race start countdown display
 *
 * Precision Instrument design:
 * - Large, clear time display
 * - Color changes as time approaches
 * - Optional manual controls
 * - Pulsing animation near zero
 */
export function CountdownTimer({
  targetTime,
  label = 'Time to Start',
  showControls = false,
  onComplete,
  onTick,
  size = 'lg',
  theme = 'default',
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [manualStart, setManualStart] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate remaining time
  const calculateRemaining = useCallback(() => {
    if (manualStart !== null) {
      return Math.max(0, manualStart - Math.floor(Date.now() / 1000));
    }
    if (!targetTime) return 0;
    const target = typeof targetTime === 'string' ? new Date(targetTime).getTime() : targetTime;
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  }, [targetTime, manualStart]);

  // Start countdown
  useEffect(() => {
    if (targetTime || manualStart !== null) {
      setRemaining(calculateRemaining());
      setIsRunning(true);
    }
  }, [targetTime, manualStart, calculateRemaining]);

  // Tick interval
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemaining(newRemaining);
      onTick?.(newRemaining);

      if (newRemaining <= 0) {
        setIsRunning(false);
        onComplete?.();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, calculateRemaining, onTick, onComplete]);

  // Format time display
  const formatTime = (seconds: number): { hours: string; minutes: string; secs: string } => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: hrs.toString().padStart(2, '0'),
      minutes: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  };

  // Manual control handlers
  const handleStart = () => {
    if (remaining > 0) {
      setManualStart(Math.floor(Date.now() / 1000) + remaining);
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setManualStart(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleReset = (seconds: number = 300) => {
    setManualStart(Math.floor(Date.now() / 1000) + seconds);
    setRemaining(seconds);
    setIsRunning(true);
  };

  const time = formatTime(remaining);

  // Determine urgency level
  const isUrgent = remaining > 0 && remaining <= 30;
  const isWarning = remaining > 30 && remaining <= 120;
  const isComplete = remaining === 0 && (targetTime || manualStart !== null);

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'p-3',
      time: 'text-3xl',
      label: 'text-xs',
    },
    md: {
      container: 'p-4',
      time: 'text-5xl',
      label: 'text-sm',
    },
    lg: {
      container: 'p-6',
      time: 'text-7xl',
      label: 'text-base',
    },
  };

  // Theme colors
  const getThemeColor = () => {
    if (isComplete) return 'success-green';
    if (isUrgent) return 'danger-red';
    if (isWarning) return 'caution-yellow';
    if (theme === 'warning') return 'caution-yellow';
    if (theme === 'danger') return 'danger-red';
    return 'blade-blue';
  };

  const color = getThemeColor();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative rounded-2xl overflow-hidden
        bg-void-surface/80 backdrop-blur-xl saturate-[180%]
        border border-white/[0.06]
        ${sizeClasses[size].container}
      `}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500`}
        style={{
          background: `radial-gradient(circle at center, var(--${color}) 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Label */}
        <div className={`flex items-center gap-2 mb-3 ${sizeClasses[size].label}`}>
          {isUrgent ? (
            <AlertTriangle className="w-4 h-4 text-danger-red animate-pulse" />
          ) : (
            <Clock className={`w-4 h-4 text-${color}`} />
          )}
          <span className="text-text-muted uppercase tracking-wider font-medium">
            {isComplete ? 'Race Started!' : label}
          </span>
        </div>

        {/* Time display */}
        <div className={`font-mono font-bold tracking-tight ${sizeClasses[size].time}`}>
          <AnimatePresence mode="popLayout">
            {remaining >= 3600 && (
              <>
                <motion.span
                  key={`h-${time.hours}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`text-${color}`}
                >
                  {time.hours}
                </motion.span>
                <span className="text-text-muted mx-1">:</span>
              </>
            )}
            <motion.span
              key={`m-${time.minutes}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`text-${color}`}
            >
              {time.minutes}
            </motion.span>
            <span className="text-text-muted mx-1">:</span>
            <motion.span
              key={`s-${time.secs}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`${isUrgent ? 'animate-pulse' : ''} text-${color}`}
            >
              {time.secs}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        {remaining > 0 && remaining <= 300 && (
          <div className="mt-4 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-${color} rounded-full`}
              initial={{ width: '100%' }}
              animate={{ width: `${(remaining / 300) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all text-sm"
              >
                <Pause size={14} />
                Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${color}/10 border border-${color}/30 text-${color} hover:bg-${color}/20 transition-all text-sm`}
              >
                <Play size={14} />
                Start
              </button>
            )}
            <button
              onClick={() => handleReset(300)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all text-sm"
            >
              <RotateCcw size={14} />
              5 min
            </button>
            <button
              onClick={() => handleReset(60)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-all text-sm"
            >
              <RotateCcw size={14} />
              1 min
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CountdownTimer;
