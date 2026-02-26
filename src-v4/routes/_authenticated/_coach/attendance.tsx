/**
 * Attendance route: /attendance (coach-only).
 *
 * Renders the AttendancePage with active team context.
 * Read-only is false for coaches (write access already guarded by _coach layout).
 */
import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';
import { useAuth } from '@/features/auth/useAuth';
import { AttendancePage } from '@/features/coach/attendance/components/AttendancePage';
import { AttendanceSkeleton } from '@/features/coach/attendance/components/AttendanceSkeleton';

export const Route = createFileRoute('/_authenticated/_coach/attendance')({
  errorComponent: RouteErrorFallback,
  staticData: { breadcrumb: 'Attendance' },
  component: AttendanceRoute,
});

function AttendanceRoute() {
  const { activeTeamId } = useAuth();

  if (!activeTeamId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-text-faint">No active team selected</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<AttendanceSkeleton rows={8} />}>
      <AttendancePage teamId={activeTeamId} readOnly={false} />
    </Suspense>
  );
}
