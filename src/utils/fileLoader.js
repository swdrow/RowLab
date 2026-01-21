/**
 * Headshot file loading utilities
 * Handles loading athlete headshots with fallback mechanism
 */

const HEADSHOT_BASE_PATH = '/api/headshots';
const PLACEHOLDER_IMAGE = '/images/placeholder-avatar.svg';

/**
 * Get the URL for an athlete's headshot
 * Tries multiple file extensions
 * @param {object} athlete - Athlete object with lastName
 * @returns {string} URL to headshot image
 */
export const getHeadshotUrl = (athlete) => {
  if (!athlete || !athlete.lastName) {
    return PLACEHOLDER_IMAGE;
  }

  // Try the most common: LastName.jpg
  return `${HEADSHOT_BASE_PATH}/${athlete.lastName}.jpg`;
};

/**
 * Preload an image and return a promise
 * Falls back to placeholder on error
 * @param {string} src - Image source URL
 * @returns {Promise<string>} Resolved image URL (original or placeholder)
 */
export const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve(src);
    };

    img.onerror = () => {
      // Try alternative extensions
      const alternatives = [
        src.replace('.jpg', '.jpeg'),
        src.replace('.jpg', '.png'),
        src.replace('.jpeg', '.png'),
      ];

      // Try first alternative
      if (alternatives[0] !== src) {
        const img2 = new Image();
        img2.onload = () => resolve(alternatives[0]);
        img2.onerror = () => {
          // Try second alternative
          const img3 = new Image();
          img3.onload = () => resolve(alternatives[1]);
          img3.onerror = () => resolve(PLACEHOLDER_IMAGE);
          img3.src = alternatives[1];
        };
        img2.src = alternatives[0];
      } else {
        resolve(PLACEHOLDER_IMAGE);
      }
    };

    img.src = src;
  });
};

/**
 * Batch preload headshots for multiple athletes
 * @param {Array} athletes - Array of athlete objects
 * @returns {Promise<Map>} Map of athlete ID to image URL
 */
export const preloadHeadshots = async (athletes) => {
  const headshotMap = new Map();

  const promises = athletes.map(async (athlete) => {
    const url = getHeadshotUrl(athlete);
    const loadedUrl = await preloadImage(url);
    headshotMap.set(athlete.id, loadedUrl);
  });

  await Promise.all(promises);
  return headshotMap;
};

/**
 * Get country flag emoji from country code
 * @param {string} countryCode - ISO 3166-1 alpha-3 country code
 * @returns {string} Flag emoji or empty string
 */
export const getCountryFlag = (countryCode) => {
  // Map of common country codes to flag emojis
  const flagMap = {
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

  return flagMap[countryCode] || '';
};
