// src/v2/components/training/index.ts

// Calendar components
export {
  TrainingCalendar,
  DragDropCalendar,
  CalendarToolbar,
  WorkoutEventCard,
  getEventStyle,
} from './calendar';

// Workout components
export {
  WorkoutForm,
  ExerciseFieldArray,
} from './workouts';

// Periodization components
export {
  PeriodizationTimeline,
  BlockForm,
  TemplateApplicator,
} from './periodization';

// Assignment components
export {
  AssignmentManager,
  AthleteWorkoutView,
} from './assignments';

// Compliance components
export {
  ComplianceDashboard,
  WeeklyHoursTable,
  TrainingLoadChart,
  AttendanceTrainingLinkPanel,
  NCAA20HourWarning,
  NCAAWarningBadge,
  NCAAAuditReport,
} from './compliance';

// Empty states
export { CalendarEmptyState, TrainingPlansEmptyState } from './CalendarEmptyState';
export type { CalendarEmptyStateProps, TrainingPlansEmptyStateProps } from './CalendarEmptyState';
