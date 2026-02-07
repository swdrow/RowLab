import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';

// ============================================
// TYPES
// ============================================

interface NCAAAuditEntry {
  athleteId: string;
  athleteName: string;
  weekStart: string;
  totalHours: number;
  dailyHours: {
    date: string;
    hours: number;
  }[];
  isNearLimit: boolean;
  isOverLimit: boolean;
  sessions: PracticeSession[];
}

interface NCAAComplianceReport {
  weekStart: string;
  weekEnd: string;
  entries: NCAAAuditEntry[];
  athletesNearLimit: number;
  athletesOverLimit: number;
  generatedAt: string;
}

interface PracticeSession {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
}

interface WeeklyLoad {
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  totalTSS: number;
  sessionCount: number;
  averageIntensity?: number;
}

interface TrainingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function startOfWeek(date: Date, options?: { weekStartsOn?: number }): Date {
  const weekStartsOn = options?.weekStartsOn || 0; // Sunday by default
  const day = date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  const result = new Date(date);
  result.setDate(date.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function format(date: Date, formatStr: string): string {
  // Simple format function for yyyy-MM-dd
  if (formatStr === 'yyyy-MM-dd') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return date.toISOString();
}

// ============================================
// API FUNCTIONS
// ============================================

interface ComplianceOptions {
  weekStart?: Date;
  athleteId?: string;
}

async function fetchWeeklyCompliance(options: ComplianceOptions = {}): Promise<NCAAAuditEntry[]> {
  const params = new URLSearchParams();
  const weekStart = options.weekStart || startOfWeek(new Date(), { weekStartsOn: 1 });
  params.append('weekStart', format(weekStart, 'yyyy-MM-dd'));
  if (options.athleteId) params.append('athleteId', options.athleteId);

  // Use correct backend route from 10-00
  const url = `/api/v1/training-plans/compliance/weekly?${params.toString()}`;
  const response = await api.get<TrainingApiResponse<{ entries: NCAAAuditEntry[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch compliance data');
  }

  return response.data.data.entries;
}

async function fetchComplianceReport(weekStart: Date): Promise<NCAAComplianceReport> {
  const params = new URLSearchParams();
  params.append('weekStart', format(weekStart, 'yyyy-MM-dd'));

  const url = `/api/v1/training-plans/compliance/report?${params.toString()}`;
  const response = await api.get<TrainingApiResponse<{ report: NCAAComplianceReport }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch compliance report');
  }

  return response.data.data.report;
}

async function fetchTrainingLoad(options: {
  startDate: Date;
  endDate: Date;
  athleteId?: string;
}): Promise<WeeklyLoad[]> {
  const params = new URLSearchParams();
  params.append('startDate', format(options.startDate, 'yyyy-MM-dd'));
  params.append('endDate', format(options.endDate, 'yyyy-MM-dd'));
  if (options.athleteId) params.append('athleteId', options.athleteId);

  const url = `/api/v1/training-plans/load?${params.toString()}`;
  const response = await api.get<TrainingApiResponse<{ weeks: WeeklyLoad[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch training load');
  }

  return response.data.data.weeks;
}

/**
 * Fetch attendance linked to training sessions for a date (ATT-04)
 */
async function fetchAttendanceTrainingLink(date: Date): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('date', format(date, 'yyyy-MM-dd'));

  const url = `/api/v1/training-plans/attendance-link?${params.toString()}`;
  const response = await api.get<TrainingApiResponse<{ records: any[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch attendance-training link');
  }

  return response.data.data.records;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching weekly NCAA compliance data
 */
export function useNcaaWeeklyHours(weekStart?: Date, athleteId?: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const effectiveWeekStart = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 });

  const query = useQuery({
    queryKey: queryKeys.ncaaCompliance.weekly({
      weekStart: format(effectiveWeekStart, 'yyyy-MM-dd'),
      athleteId,
    }),
    queryFn: () => fetchWeeklyCompliance({ weekStart: effectiveWeekStart, athleteId }),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching NCAA compliance audit report
 */
export function useNcaaComplianceReport(weekStart: Date) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.ncaaCompliance.daily({ weekStart: format(weekStart, 'yyyy-MM-dd') }),
    queryFn: () => fetchComplianceReport(weekStart),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    report: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching training load (TSS/volume) over time
 */
export function useTrainingLoad(startDate: Date, endDate: Date, athleteId?: string) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: [
      ...queryKeys.trainingPlans.all,
      'load',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
      athleteId,
    ],
    queryFn: () => fetchTrainingLoad({ startDate, endDate, athleteId }),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    weeks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching attendance linked to training sessions (ATT-04)
 * Shows which athletes attended which scheduled training sessions
 */
export function useAttendanceTrainingLink(date: Date) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: [...queryKeys.attendance.all, 'trainingLink', format(date, 'yyyy-MM-dd')],
    queryFn: () => fetchAttendanceTrainingLink(date),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    records: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
