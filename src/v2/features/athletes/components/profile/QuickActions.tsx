import { useNavigate } from 'react-router-dom';
import { PencilLine, CalendarCheck, ArrowRight, Timer, BarChart3, Dumbbell } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────
export interface QuickActionsProps {
  athleteId: string;
  athleteName: string;
}

// ─── QuickActions Component ────────────────────────────────────────
export function QuickActions({ athleteId, athleteName }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
        Quick Actions
      </h4>

      {/* Primary Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/app/erg-tests?athlete=${athleteId}&action=create`)}
          className="
            flex-1 flex items-center justify-center gap-2 px-3 py-2
            bg-interactive-primary text-white text-sm font-medium rounded-lg
            hover:bg-interactive-primary-hover active:scale-[0.98]
            transition-all
          "
          aria-label={`Log erg test for ${athleteName}`}
        >
          <PencilLine className="h-4 w-4" />
          Log Erg Test
        </button>
        <button
          onClick={() => navigate(`/app/attendance?athlete=${athleteId}`)}
          className="
            flex-1 flex items-center justify-center gap-2 px-3 py-2
            bg-bg-surface border border-bdr-default text-txt-primary text-sm font-medium rounded-lg
            hover:bg-bg-hover active:scale-[0.98]
            transition-all
          "
          aria-label={`Record attendance for ${athleteName}`}
        >
          <CalendarCheck className="h-4 w-4" />
          Record Attendance
        </button>
      </div>

      {/* Navigation Links */}
      <div className="space-y-0.5">
        <NavLink
          icon={<Timer className="h-3.5 w-3.5" />}
          label="View Erg History"
          onClick={() => navigate(`/app/erg-tests?athlete=${athleteId}`)}
        />
        <NavLink
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Seat Racing Rankings"
          onClick={() => navigate('/app/seat-racing')}
        />
        <NavLink
          icon={<Dumbbell className="h-3.5 w-3.5" />}
          label="Training Plan"
          onClick={() => navigate('/app/training')}
        />
      </div>
    </div>
  );
}

// ─── NavLink Sub-component ─────────────────────────────────────────
interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function NavLink({ icon, label, onClick }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-2 px-2 py-1.5
        text-sm text-txt-secondary
        hover:text-txt-primary hover:bg-bg-hover
        rounded-md transition-colors group
      "
    >
      {icon}
      <span className="group-hover:underline underline-offset-2">{label}</span>
      <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default QuickActions;
