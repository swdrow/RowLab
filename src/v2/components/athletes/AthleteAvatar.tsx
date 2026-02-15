import { useMemo, useState } from 'react';

export interface AthleteAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showHeadshot?: boolean;
}

/**
 * Generate deterministic HSL color from string
 */
function stringToHSL(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Hue: 0-360 degrees (full color spectrum)
  const hue = Math.abs(hash % 360);

  // Saturation: 45-75% (vibrant but not oversaturated)
  const saturation = 45 + Math.abs(hash % 30);

  // Lightness: 35-55% (readable contrast for white text)
  const lightness = 35 + Math.abs(hash % 20);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get initials from full name
 */
function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function AthleteAvatar({
  firstName,
  lastName,
  photoUrl,
  size = 'md',
  className = '',
  showHeadshot = true,
}: AthleteAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = useMemo(() => getInitials(firstName, lastName), [firstName, lastName]);
  const backgroundColor = useMemo(
    () => stringToHSL(`${firstName}${lastName}`),
    [firstName, lastName]
  );

  // Only use an explicitly provided photo URL — don't guess URLs by last name
  // as that causes 404 errors for athletes without headshots
  const imageUrl = photoUrl || null;

  if (imageUrl && !imageError) {
    return (
      <div className={`${SIZES[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${SIZES[size]} rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor }}
      title={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
}

export default AthleteAvatar;
