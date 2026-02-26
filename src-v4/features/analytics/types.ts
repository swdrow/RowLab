/**
 * Analytics feature types.
 * Interfaces for PMC (Performance Management Chart), volume trends, and insights.
 */

export interface PMCDataPoint {
  date: string; // YYYY-MM-DD
  ctl: number; // Chronic Training Load (fitness)
  atl: number; // Acute Training Load (fatigue)
  tsb: number; // Training Stress Balance (form)
  tss: number; // Daily Training Stress Score
  byType: Record<string, number>; // TSS by sport type
}

export interface PMCResponse {
  points: PMCDataPoint[];
  currentCTL: number;
  currentATL: number;
  currentTSB: number;
  daysWithData: number;
  totalDays: number;
  acwr: number | null;
  insights: InsightItem[];
  hasCustomSettings: boolean;
}

export interface AnalyticsSettings {
  dateOfBirth: string | null;
  maxHeartRate: number | null;
  lactateThresholdHR: number | null;
  functionalThresholdPower: number | null;
  tsbAlertThreshold: number | null;
  acwrAlertThreshold: number | null;
}

export interface VolumeBucket {
  period: string; // ISO week key or YYYY-MM
  startDate: string; // Period start date
  endDate: string; // Period end date
  byType: Record<string, number>; // meters or seconds by sport type
  total: number;
  workoutCount: number;
}

export interface VolumeSummary {
  totalDistance: number;
  totalDuration: number;
  totalSessions: number;
  avgPerPeriod: number;
}

export interface VolumeResponse {
  buckets: VolumeBucket[];
  summary: VolumeSummary;
  rollingAverage: number[];
}

export interface InsightItem {
  type: 'positive' | 'caution' | 'warning';
  message: string;
  icon: string;
}

export type PMCRange = '30d' | '90d' | '180d' | '365d' | 'all';
export type VolumeRange = '4w' | '12w' | '6m' | '1y';
export type VolumeGranularity = 'weekly' | 'monthly';
export type VolumeMetric = 'distance' | 'duration';
