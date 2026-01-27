import React from 'react';

type TileSize = 'large' | 'medium' | 'small';

interface BentoTileProps {
  size: TileSize;
  title: string;
  description: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
  className?: string;
  gridArea?: string;
}

// Size-specific padding and text scales
const sizeStyles: Record<TileSize, string> = {
  large: 'p-8 text-lg',
  medium: 'p-6 text-base',
  small: 'p-5 text-sm',
};

// Title sizes
const titleSizes: Record<TileSize, string> = {
  large: 'text-2xl',
  medium: 'text-xl',
  small: 'text-lg',
};

export const BentoTile: React.FC<BentoTileProps> = ({
  size,
  title,
  description,
  icon,
  preview,
  className = '',
  gridArea,
}) => {
  return (
    <div
      className={`
        bg-ink-raised border border-ink-border rounded-lg
        transition-colors duration-200
        hover:border-ink-border-strong
        flex flex-col
        ${sizeStyles[size]}
        ${className}
      `}
      style={gridArea ? { gridArea } : undefined}
    >
      {/* Icon */}
      {icon && (
        <div className="w-12 h-12 bg-ink-base rounded-lg flex items-center justify-center text-ink-primary mb-4">
          {icon}
        </div>
      )}

      {/* Title - Serif for editorial feel */}
      <h3 className={`font-display font-semibold text-ink-bright mb-2 ${titleSizes[size]}`}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-ink-body leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      {/* Optional preview area (for screenshots, animations, etc.) */}
      {preview && (
        <div className="mt-auto pt-4 border-t border-ink-border/50">
          {preview}
        </div>
      )}
    </div>
  );
};

export default BentoTile;
