/**
 * Full-page empty state for brand-new users with zero data.
 * Features a geometric SVG illustration with rowing-inspired shapes,
 * welcome copy, and 3 actionable CTAs to real routes.
 * Ref: DASH-08 (zero-data empty state).
 */

import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import type { Variant } from 'motion/react';
import { SPRING_SMOOTH } from '@/lib/animations';
import { Button } from '@/components/ui/Button';

/**
 * Geometric SVG illustration with rowing-inspired abstract shapes.
 * Uses oklch design token CSS variables for colors.
 * Animated with CSS keyframes for subtle life.
 */
function RowingIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[160px] h-[120px] md:w-[200px] md:h-[160px]"
      role="img"
      aria-label="Rowing illustration"
    >
      {/* Water wave lines */}
      <path
        d="M 10 110 Q 50 95 100 110 Q 150 125 190 110"
        className="stroke-accent-copper"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      >
        <animate
          attributeName="d"
          values="M 10 110 Q 50 95 100 110 Q 150 125 190 110;M 10 110 Q 50 120 100 110 Q 150 100 190 110;M 10 110 Q 50 95 100 110 Q 150 125 190 110"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 20 125 Q 60 113 110 125 Q 160 137 195 125"
        className="stroke-accent-copper"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      >
        <animate
          attributeName="d"
          values="M 20 125 Q 60 113 110 125 Q 160 137 195 125;M 20 125 Q 60 132 110 125 Q 160 118 195 125;M 20 125 Q 60 113 110 125 Q 160 137 195 125"
          dur="5s"
          repeatCount="indefinite"
        />
      </path>

      {/* Boat hull — sleek racing shell shape */}
      <path
        d="M 30 100 Q 100 92 170 100 L 185 104 Q 100 108 15 104 Z"
        className="fill-ink-raised stroke-accent-copper"
        strokeWidth="1.5"
      />

      {/* Oar — diagonal line suggesting motion */}
      <line
        x1="85"
        y1="70"
        x2="140"
        y2="100"
        className="stroke-ink-muted"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="100"
        x2="115"
        y2="70"
        className="stroke-ink-muted"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Rower silhouette — abstract geometric figure */}
      <circle
        cx="100"
        cy="62"
        r="8"
        className="fill-ink-raised stroke-accent-copper"
        strokeWidth="1.5"
      >
        <animate attributeName="cy" values="62;60;62" dur="3s" repeatCount="indefinite" />
      </circle>
      <path
        d="M 92 72 L 100 90 L 108 72"
        className="fill-ink-raised stroke-accent-copper"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <animate
          attributeName="d"
          values="M 92 72 L 100 90 L 108 72;M 93 71 L 100 88 L 107 71;M 92 72 L 100 90 L 108 72"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>

      {/* Motion lines — speed streaks behind the boat */}
      <line
        x1="8"
        y1="98"
        x2="25"
        y2="98"
        className="stroke-accent-copper"
        strokeWidth="1"
        opacity="0.4"
        strokeLinecap="round"
      >
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </line>
      <line
        x1="5"
        y1="103"
        x2="18"
        y2="103"
        className="stroke-accent-copper"
        strokeWidth="1"
        opacity="0.3"
        strokeLinecap="round"
      >
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/** Stagger container variant */
const containerVariants: Record<string, Variant> = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/** Child slide-up variant (no transition key — inherits from container) */
const itemVariants: Record<string, Variant> = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SMOOTH,
  },
};

export function DashboardEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 max-w-lg mx-auto"
    >
      {/* Illustration */}
      <motion.div variants={itemVariants} className="mb-8">
        <RowingIllustration />
      </motion.div>

      {/* Welcome copy */}
      <motion.div variants={itemVariants} className="mb-8 space-y-3">
        <h1 className="text-2xl font-semibold text-ink-primary">Welcome to RowLab</h1>
        <p className="text-ink-secondary text-base leading-relaxed max-w-sm mx-auto">
          Your personal training hub starts here. Log your first workout to see your stats come to
          life.
        </p>
      </motion.div>

      {/* CTAs — 3 actionable buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => navigate({ to: '/workouts', search: { action: 'new' } as never })}
        >
          Log a Workout
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => navigate({ to: '/settings' })}
        >
          Connect Concept2
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => navigate({ to: '/create-team' })}
        >
          Join a Team
        </Button>
      </motion.div>
    </motion.div>
  );
}
