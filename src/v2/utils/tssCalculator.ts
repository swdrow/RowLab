import type { WorkoutData } from '../types/training';

/**
 * Calculate Training Stress Score (TSS) for a workout.
 * Adapted for rowing with power meter or HR fallback.
 *
 * TSS = (duration * NP * IF) / (FTP * 3600) * 100
 * where IF = Intensity Factor = NP / FTP
 *
 * For rowing, we use avgWatts as NP approximation.
 */
export function calculateTSS(data: WorkoutData): number {
  const { durationSeconds, avgWatts, avgHeartRate, ftp, fthr } = data;

  // Power-based TSS (most accurate)
  if (avgWatts && ftp && ftp > 0) {
    const intensityFactor = avgWatts / ftp;
    const tss = (durationSeconds * avgWatts * intensityFactor) / (ftp * 3600) * 100;
    return Math.round(tss);
  }

  // HR-based TSS fallback (hrTSS)
  if (avgHeartRate && fthr && fthr > 0) {
    const intensityFactor = avgHeartRate / fthr;
    const hrTSS = (durationSeconds / 3600) * intensityFactor * intensityFactor * 100;
    return Math.round(hrTSS);
  }

  // Duration-based estimate (least accurate, assume moderate intensity IF ~0.75)
  const estimatedTSS = (durationSeconds / 3600) * 0.75 * 0.75 * 100;
  return Math.round(estimatedTSS);
}

/**
 * Calculate weekly training load from workouts.
 */
export function calculateWeeklyLoad(workouts: WorkoutData[]): {
  totalTSS: number;
  avgTSSPerDay: number;
  peakTSS: number;
  totalVolume: number; // minutes
} {
  if (workouts.length === 0) {
    return { totalTSS: 0, avgTSSPerDay: 0, peakTSS: 0, totalVolume: 0 };
  }

  const tssValues = workouts.map(calculateTSS);
  const totalTSS = tssValues.reduce((sum, tss) => sum + tss, 0);
  const totalVolume = workouts.reduce((sum, w) => sum + (w.durationSeconds / 60), 0);

  return {
    totalTSS,
    avgTSSPerDay: Math.round(totalTSS / 7),
    peakTSS: Math.max(...tssValues),
    totalVolume: Math.round(totalVolume),
  };
}

/**
 * Estimate TSS from workout parameters when no actual data available.
 */
export function estimateTSSFromPlan(
  durationMinutes: number,
  intensity: 'easy' | 'moderate' | 'hard' | 'max'
): number {
  // Intensity factors for estimation
  const intensityFactors: Record<string, number> = {
    easy: 0.55,
    moderate: 0.75,
    hard: 0.90,
    max: 1.05,
  };

  const IF = intensityFactors[intensity] || 0.75;
  const durationHours = durationMinutes / 60;
  const tss = durationHours * IF * IF * 100;
  return Math.round(tss);
}
