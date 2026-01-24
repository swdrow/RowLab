/**
 * Country code to flag emoji mapping
 */

const FLAG_MAP: Record<string, string> = {
  'USA': '🇺🇸',
  'CAN': '🇨🇦',
  'GBR': '🇬🇧',
  'AUS': '🇦🇺',
  'NZL': '🇳🇿',
  'DEU': '🇩🇪',
  'FRA': '🇫🇷',
  'ITA': '🇮🇹',
  'ESP': '🇪🇸',
  'NED': '🇳🇱',
  'BEL': '🇧🇪',
  'SWE': '🇸🇪',
  'NOR': '🇳🇴',
  'DEN': '🇩🇰',
  'POL': '🇵🇱',
  'ROU': '🇷🇴',
  'SRB': '🇷🇸',
  'CZE': '🇨🇿',
  'UKR': '🇺🇦',
  'RUS': '🇷🇺',
  'CHN': '🇨🇳',
  'JPN': '🇯🇵',
  'KOR': '🇰🇷',
  'IND': '🇮🇳',
  'EGY': '🇪🇬',
  'RSA': '🇿🇦',
  'BRA': '🇧🇷',
  'ARG': '🇦🇷',
  'MEX': '🇲🇽',
};

/**
 * Get flag emoji from country code
 */
export function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode) return '';
  return FLAG_MAP[countryCode.toUpperCase()] || '';
}

/**
 * Get headshot URL for an athlete
 */
export function getHeadshotUrl(lastName: string): string {
  return `/api/headshots/${lastName}.jpg`;
}
