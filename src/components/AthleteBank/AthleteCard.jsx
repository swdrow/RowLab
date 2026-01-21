import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useLineupStore from '../../store/lineupStore';

// Convert country code to flag emoji
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 3) return '';
  // Map common 3-letter codes to 2-letter ISO codes
  const countryMap = {
    'USA': 'US', 'GBR': 'GB', 'CAN': 'CA', 'AUS': 'AU', 'NZL': 'NZ',
    'GER': 'DE', 'FRA': 'FR', 'ITA': 'IT', 'ESP': 'ES', 'NED': 'NL',
    'BEL': 'BE', 'SUI': 'CH', 'AUT': 'AT', 'DEN': 'DK', 'NOR': 'NO',
    'SWE': 'SE', 'FIN': 'FI', 'POL': 'PL', 'CZE': 'CZ', 'HUN': 'HU',
    'ROU': 'RO', 'UKR': 'UA', 'RUS': 'RU', 'JPN': 'JP', 'CHN': 'CN',
    'KOR': 'KR', 'IND': 'IN', 'BRA': 'BR', 'ARG': 'AR', 'MEX': 'MX',
    'RSA': 'ZA', 'IRL': 'IE', 'POR': 'PT', 'GRE': 'GR', 'TUR': 'TR'
  };
  const isoCode = countryMap[countryCode.toUpperCase()] || countryCode.slice(0, 2).toUpperCase();
  return isoCode.split('').map(char =>
    String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65)
  ).join('');
};

/**
 * Precision Instrument Athlete Card
 * Whoop-style compact card with gradient borders and neon accents
 */
const AthleteCard = ({ athlete, isAssigned, onClick, onDoubleClick }) => {
  const { selectedAthlete, headshotMap } = useLineupStore();

  // Get headshot or use placeholder
  const avatarSrc = headshotMap?.get(athlete.id) || '/images/placeholder-avatar.svg';

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
    ? 'bg-blade-blue/20 text-blade-blue border-blade-blue/30'
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
        transition-all duration-150 ease-out
        ${isAssigned
          ? 'opacity-40 cursor-not-allowed bg-void-elevated/30 border border-white/[0.04]'
          : `cursor-pointer
             bg-void-elevated border border-white/5
             hover:translate-y-[-2px]
             hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)]
             hover:border-white/10
            `
        }
        ${isSelected
          ? `!border-blade-blue/40 !bg-blade-blue/5
             shadow-[0_0_20px_-4px_rgba(0,112,243,0.3),inset_0_1px_0_0_rgba(0,112,243,0.1)]`
          : ''
        }
        ${isDragging ? 'opacity-60 scale-95 rotate-2' : ''}
      `}
    >
      {/* Profile Picture */}
      <div className="relative mb-1">
        <img
          src={avatarSrc}
          alt={athlete.lastName}
          className={`w-10 h-10 rounded-full object-cover border-2 transition-all duration-200 ${
            isSelected
              ? 'border-blade-blue shadow-[0_0_12px_-2px_rgba(0,112,243,0.4)]'
              : 'border-white/10 group-hover:border-white/20'
          }`}
          onError={(e) => {
            e.target.src = '/images/placeholder-avatar.svg';
          }}
        />
        {/* Country flag overlay */}
        {athlete.country && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-void-surface border border-white/10 flex items-center justify-center overflow-hidden">
            <span className="text-[8px]">{getCountryFlag(athlete.country)}</span>
          </div>
        )}
      </div>

      {/* Name - stacked vertically */}
      <div className="text-center min-w-0 w-full">
        <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blade-blue' : 'text-text-primary'}`}>
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
        <div className="absolute -top-1.5 -right-1.5 bg-blade-blue text-void-deep rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(0,112,243,0.5)]">
          ✓
        </div>
      )}

      {/* Hover glow effect */}
      {!isAssigned && !isSelected && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none bg-gradient-to-t from-blade-blue/5 to-transparent" />
      )}
    </div>
  );
};

export default AthleteCard;
