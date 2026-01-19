import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * 3D Cockpit Card - The ONE moment of full physics
 * Mouse-tracking tilt with spring physics (Rauno Freiberg style)
 */
export function HeroCockpitCard({ children, className }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      className={clsx(
        `relative w-full max-w-[700px] p-8
        rounded-3xl
        backdrop-blur-[40px] saturate-[200%]

        /* Gradient stroke border */
        border border-transparent
        [background-image:linear-gradient(rgba(18,18,20,0.9),rgba(18,18,20,0.9)),linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0)_100%)]
        [background-origin:padding-box,border-box]
        [background-clip:padding-box,border-box]

        /* Shadow layers */
        shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_50px_-20px_rgba(0,0,0,0.5),0_0_100px_-20px_rgba(0,229,153,0.2)]`,
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {children}
    </motion.div>
  );
}

/**
 * Mini Lineup Preview inside the cockpit card
 */
export function LineupPreview() {
  const seats = [
    { num: 8, label: 'Stroke', name: 'Thompson', erg: '6:02.4', side: 'port' },
    { num: 7, name: 'Garcia', erg: '6:05.1', side: 'starboard' },
    { num: 6, name: 'Chen', erg: '6:08.3', side: 'port' },
    { num: 5, name: 'Okonkwo', erg: '6:04.7', side: 'starboard' },
    { num: 4, name: 'Wilson', erg: '6:06.2', side: 'port' },
    { num: 3, name: 'Kim', erg: '6:09.1', side: 'starboard' },
    { num: 2, name: 'Martinez', erg: '6:07.5', side: 'port' },
    { num: 1, label: 'Bow', name: 'Taylor', erg: '6:10.2', side: 'starboard' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-blade-green">
            VARSITY 8+
          </span>
          <h3 className="font-display text-xl font-semibold text-text-primary mt-1">
            Spring Lineup
          </h3>
        </div>
        <div className="text-right">
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted">
            PREDICTED SPEED
          </span>
          <div className="font-mono text-2xl font-semibold text-blade-green text-glow-green">
            1:42.5
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="grid grid-cols-2 gap-2">
        {seats.map((seat, i) => (
          <motion.div
            key={seat.num}
            initial={{ opacity: 0, x: seat.side === 'port' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-xl',
              'bg-void-surface/50 border border-white/[0.06]',
              'transition-all duration-200',
              'hover:bg-void-surface hover:border-white/[0.1]'
            )}
          >
            {/* Seat number badge */}
            <div
              className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                'text-xs font-semibold',
                seat.side === 'port'
                  ? 'bg-danger-red/20 text-danger-red border border-danger-red/30'
                  : 'bg-blade-green/20 text-blade-green border border-blade-green/30'
              )}
            >
              {seat.num}
            </div>

            {/* Athlete info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {seat.name}
              </div>
              <div className="font-mono text-xs text-text-muted">
                {seat.erg}
              </div>
            </div>

            {/* Side indicator */}
            <div className="font-mono text-[10px] tracking-wider text-text-muted uppercase">
              {seat.side === 'port' ? 'P' : 'S'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default HeroCockpitCard;
