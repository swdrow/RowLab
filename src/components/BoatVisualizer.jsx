import React from 'react';
import { motion } from 'framer-motion';

/**
 * Stylized SVG Boat Visualizer
 * A clean, lightweight 2D representation of a rowing shell
 */

const COLORS = {
  hull: '#1e3a5f',
  hullStroke: '#0f2744',
  deck: '#2d5a87',
  water: '#e8f4fc',
  waterRipple: '#cce7f7',
  port: '#e74c3c',
  starboard: '#27ae60',
  coxswain: '#f39c12',
  empty: '#94a3b8',
  rigger: '#64748b',
};

// Individual seat component
const Seat = ({ x, y, side, athlete, seatNumber, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getColor = () => {
    if (isSelected) return '#3b82f6';
    if (!athlete) return COLORS.empty;
    if (side === 'Cox') return COLORS.coxswain;
    return side === 'Port' ? COLORS.port : COLORS.starboard;
  };

  const isOccupied = !!athlete;
  const scale = isHovered ? 1.15 : 1;

  return (
    <motion.g
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale,
      }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { type: 'spring', stiffness: 400, damping: 25 }
      }}
    >
      {/* Seat */}
      <rect
        x={x - 12}
        y={y - 8}
        width={24}
        height={16}
        rx={3}
        fill={getColor()}
        stroke={isSelected ? '#1d4ed8' : isHovered ? '#fff' : 'rgba(0,0,0,0.2)'}
        strokeWidth={isSelected ? 2 : isHovered ? 2 : 1}
      />

      {/* Athlete indicator dot */}
      {isOccupied && (
        <circle
          cx={x}
          cy={y}
          r={4}
          fill="white"
        />
      )}

      {/* Seat number (small) */}
      <text
        x={x}
        y={y + 24}
        textAnchor="middle"
        fontSize="9"
        fill={isHovered ? '#1e3a5f' : '#64748b'}
        fontWeight={isHovered ? '600' : '500'}
      >
        {side === 'Cox' ? 'C' : seatNumber}
      </text>
    </motion.g>
  );
};

// Oar component
const Oar = ({ x, y, side, hasAthlete }) => {
  if (!hasAthlete) return null;

  const oarLength = 45;
  const direction = side === 'Port' ? -1 : 1;
  const color = side === 'Port' ? COLORS.port : COLORS.starboard;

  return (
    <motion.g
      initial={{ opacity: 0, x: direction * -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Oar shaft */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + (direction * oarLength)}
        stroke="#cbd5e1"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Oar blade */}
      <ellipse
        cx={x}
        cy={y + (direction * (oarLength + 8))}
        rx={4}
        ry={10}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </motion.g>
  );
};

// Rigger component
const Rigger = ({ x, y, side }) => {
  const direction = side === 'Port' ? -1 : 1;

  return (
    <g>
      {/* Rigger arm */}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + (direction * 22)}
        stroke={COLORS.rigger}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Oarlock */}
      <circle
        cx={x}
        cy={y + (direction * 22)}
        r={3}
        fill={COLORS.rigger}
      />
    </g>
  );
};

// Water ripple animation
const WaterRipples = () => (
  <g>
    {[0, 1, 2].map((i) => (
      <motion.ellipse
        key={i}
        cx={200}
        cy={150}
        rx={180 + i * 30}
        ry={80 + i * 15}
        fill="none"
        stroke={COLORS.waterRipple}
        strokeWidth={1}
        initial={{ opacity: 0.6, scale: 0.95 }}
        animate={{
          opacity: [0.6, 0.2, 0.6],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          duration: 3,
          delay: i * 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    ))}
  </g>
);

// Main component
const BoatVisualizer = ({
  boat,
  onSeatClick,
  selectedSeat = null,
  className = '',
  showLabels = true
}) => {
  const numSeats = boat?.seats?.length || 8;
  const hasCoxswain = boat?.boatConfig?.hasCoxswain;

  // Calculate dimensions
  const seatSpacing = 38;
  const boatLength = numSeats * seatSpacing + 80;
  const viewBoxWidth = boatLength + 100;
  const viewBoxHeight = 300;

  // Generate seat data
  const seats = [];
  for (let i = 0; i < numSeats; i++) {
    const xPos = 60 + (numSeats - 1 - i) * seatSpacing;
    const side = i % 2 === 0 ? 'Port' : 'Starboard';
    seats.push({
      x: xPos,
      y: 150,
      side,
      seatNumber: numSeats - i,
      athlete: boat?.seats?.[numSeats - 1 - i]?.athlete
    });
  }

  // Add coxswain if applicable
  if (hasCoxswain) {
    seats.push({
      x: 30,
      y: 150,
      side: 'Cox',
      seatNumber: 0,
      athlete: boat?.coxswain
    });
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full"
        style={{ background: `linear-gradient(180deg, ${COLORS.water} 0%, #d4edfc 100%)` }}
      >
        {/* Water ripples */}
        <WaterRipples />

        {/* Hull shadow */}
        <ellipse
          cx={viewBoxWidth / 2}
          cy={165}
          rx={boatLength / 2 - 10}
          ry={18}
          fill="rgba(0,0,0,0.1)"
        />

        {/* Main hull */}
        <motion.path
          d={`
            M ${viewBoxWidth / 2 - boatLength / 2} 150
            Q ${viewBoxWidth / 2 - boatLength / 2 - 15} 150, ${viewBoxWidth / 2 - boatLength / 2 - 20} 150
            L ${viewBoxWidth / 2 + boatLength / 2 + 20} 150
            Q ${viewBoxWidth / 2 + boatLength / 2 + 25} 150, ${viewBoxWidth / 2 + boatLength / 2 + 20} 145
            L ${viewBoxWidth / 2 + boatLength / 2 + 30} 150
            L ${viewBoxWidth / 2 + boatLength / 2 + 20} 155
            Q ${viewBoxWidth / 2 + boatLength / 2 + 25} 150, ${viewBoxWidth / 2 + boatLength / 2 + 20} 150
          `}
          fill={COLORS.hull}
          stroke={COLORS.hullStroke}
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Hull body */}
        <rect
          x={viewBoxWidth / 2 - boatLength / 2}
          y={142}
          width={boatLength}
          height={16}
          rx={8}
          fill={COLORS.hull}
          stroke={COLORS.hullStroke}
          strokeWidth={1}
        />

        {/* Deck stripe */}
        <rect
          x={viewBoxWidth / 2 - boatLength / 2 + 10}
          y={148}
          width={boatLength - 20}
          height={4}
          rx={2}
          fill={COLORS.deck}
        />

        {/* Bow (pointed end) */}
        <polygon
          points={`
            ${viewBoxWidth / 2 + boatLength / 2},150
            ${viewBoxWidth / 2 + boatLength / 2 + 25},150
            ${viewBoxWidth / 2 + boatLength / 2 + 35},150
          `}
          fill={COLORS.hull}
          stroke={COLORS.hullStroke}
          strokeWidth={1}
        />

        {/* Bow ball */}
        <circle
          cx={viewBoxWidth / 2 + boatLength / 2 + 38}
          cy={150}
          r={4}
          fill="#ef4444"
        />

        {/* Stern */}
        <path
          d={`
            M ${viewBoxWidth / 2 - boatLength / 2} 142
            Q ${viewBoxWidth / 2 - boatLength / 2 - 12} 150, ${viewBoxWidth / 2 - boatLength / 2} 158
          `}
          fill={COLORS.hull}
          stroke={COLORS.hullStroke}
          strokeWidth={1}
        />

        {/* Riggers and Oars */}
        {seats.filter(s => s.side !== 'Cox').map((seat, i) => (
          <g key={`rigger-${i}`}>
            <Rigger x={seat.x} y={150} side={seat.side} />
            <Oar x={seat.x} y={150 + (seat.side === 'Port' ? -22 : 22)} side={seat.side} hasAthlete={seat.athlete} />
          </g>
        ))}

        {/* Seats */}
        {seats.map((seat, i) => (
          <Seat
            key={i}
            {...seat}
            isSelected={selectedSeat === seat.seatNumber}
            onClick={() => onSeatClick?.(seat.seatNumber, seat.side)}
          />
        ))}

        {/* Direction indicator */}
        <g transform={`translate(${viewBoxWidth / 2 + boatLength / 2 + 15}, 120)`}>
          <text fontSize="10" fill="#64748b" textAnchor="middle">BOW</text>
          <path d="M 0 8 L 5 15 L -5 15 Z" fill="#64748b" />
        </g>

        <g transform={`translate(${viewBoxWidth / 2 - boatLength / 2 - 15}, 120)`}>
          <text fontSize="10" fill="#64748b" textAnchor="middle">STERN</text>
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs glass-card rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.port }} />
          <span className="text-text-secondary">Port</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.starboard }} />
          <span className="text-text-secondary">Starboard</span>
        </div>
        {hasCoxswain && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.coxswain }} />
            <span className="text-text-secondary">Cox</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.empty }} />
          <span className="text-text-secondary">Empty</span>
        </div>
      </div>

      {/* Boat info */}
      {showLabels && (
        <div className="absolute top-3 left-3 glass-card rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">
            {boat?.boatConfig?.name || 'Boat'}
          </div>
          <div className="text-xs text-text-muted">
            {boat?.shellName || 'No shell assigned'}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoatVisualizer;
