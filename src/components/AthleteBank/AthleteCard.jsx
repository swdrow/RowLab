import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useLineupStore from '../../store/lineupStore';

/**
 * Precision Instrument Athlete Card
 * Whoop-style compact card with gradient borders and neon accents
 */
const AthleteCard = ({ athlete, isAssigned, onClick, onDoubleClick }) => {
  const { selectedAthlete } = useLineupStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `athlete-${athlete.id}`,
    data: {
      athlete,
      type: 'athlete'
    },
    disabled: isAssigned
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const isSelected = selectedAthlete?.id === athlete.id;

  // Determine side indicator color
  const sideColor = athlete.side === 'port'
    ? 'bg-danger-red/20 text-danger-red border-danger-red/30'
    : athlete.side === 'starboard'
    ? 'bg-blade-green/20 text-blade-green border-blade-green/30'
    : 'bg-white/10 text-text-muted border-white/10';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isAssigned && onClick(athlete)}
      onDoubleClick={() => onDoubleClick && onDoubleClick(athlete)}
      className={`
        group relative flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isAssigned
          ? 'opacity-40 cursor-not-allowed bg-void-elevated/30 border border-white/[0.04]'
          : `cursor-pointer
             bg-void-surface/80 backdrop-blur-sm
             border border-transparent
             [background-image:linear-gradient(rgba(18,18,20,0.9),rgba(18,18,20,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]
             [background-origin:padding-box,border-box]
             [background-clip:padding-box,border-box]
             hover:translate-y-[-2px]
             hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)]
             hover:[background-image:linear-gradient(rgba(18,18,20,0.9),rgba(18,18,20,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]
            `
        }
        ${isSelected
          ? `!border-blade-green/40 !bg-blade-green/5
             shadow-[0_0_20px_-4px_rgba(0,229,153,0.3),inset_0_1px_0_0_rgba(0,229,153,0.1)]
             [background-image:linear-gradient(rgba(0,229,153,0.05),rgba(0,229,153,0.02)),linear-gradient(to_bottom,rgba(0,229,153,0.3),rgba(0,229,153,0.1))]`
          : ''
        }
        ${isDragging ? 'opacity-60 scale-95 rotate-2' : ''}
      `}
    >
      {/* Name - stacked vertically */}
      <div className="text-center min-w-0 w-full">
        <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blade-green' : 'text-text-primary'}`}>
          {athlete.lastName}
        </div>
        {athlete.firstName && (
          <div className="text-[10px] text-text-muted truncate">
            {athlete.firstName}
          </div>
        )}
      </div>

      {/* Side indicator + Country */}
      <div className="flex items-center gap-1.5">
        {athlete.side && (
          <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase border ${sideColor}`}>
            {athlete.side === 'port' ? 'P' : athlete.side === 'starboard' ? 'S' : 'B'}
          </div>
        )}
        <div className="text-[9px] text-text-muted font-mono tracking-wider">
          {athlete.country}
        </div>
      </div>

      {/* Assigned indicator with neon glow */}
      {isAssigned && (
        <div className="absolute -top-1.5 -right-1.5 bg-blade-green text-void-deep rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(0,229,153,0.5)]">
          ✓
        </div>
      )}

      {/* Hover glow effect */}
      {!isAssigned && !isSelected && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-blade-green/5 to-transparent" />
      )}
    </div>
  );
};

export default AthleteCard;
