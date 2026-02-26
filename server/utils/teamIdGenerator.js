/**
 * Team ID Generator
 *
 * Generates unique adjective-animal identifiers for teams.
 * Format: "adjective-animal" (lowercase, hyphenated)
 * Example: "swift-otter", "golden-falcon", "storm-ridge"
 *
 * Includes collision detection with retry (up to 5 attempts).
 * On exhaustion, appends a 2-digit random number.
 */

const ADJECTIVES = [
  'swift',
  'bold',
  'quiet',
  'fierce',
  'steady',
  'bright',
  'golden',
  'silver',
  'iron',
  'noble',
  'brave',
  'keen',
  'sleek',
  'rapid',
  'mighty',
  'agile',
  'prime',
  'vast',
  'grand',
  'true',
  'sharp',
  'calm',
  'fleet',
  'stout',
  'loyal',
  'wild',
  'free',
  'sure',
  'hard',
  'raw',
  'fine',
  'cool',
  'warm',
  'deep',
  'high',
  'long',
  'fast',
  'slim',
  'trim',
  'full',
  'clear',
  'dark',
  'light',
  'fresh',
  'clean',
  'pure',
  'strong',
  'smart',
  'wise',
  'fair',
  'proud',
  'great',
  'good',
  'epic',
  'neat',
  'rare',
  'live',
  'blue',
  'red',
  'teal',
  'jade',
  'sage',
  'dawn',
  'dusk',
  'peak',
  'crest',
  'ridge',
  'bay',
  'reef',
  'cove',
  'glen',
  'vale',
  'brook',
  'ford',
  'dale',
  'shore',
  'cape',
  'isle',
  'arch',
  'blaze',
  'frost',
  'storm',
  'gale',
  'wave',
  'tide',
  'breeze',
];

const ANIMALS = [
  'otter',
  'falcon',
  'heron',
  'fox',
  'hawk',
  'wolf',
  'bear',
  'eagle',
  'crane',
  'pike',
  'trout',
  'bass',
  'stag',
  'elk',
  'lynx',
  'rook',
  'wren',
  'lark',
  'dove',
  'swan',
  'drake',
  'mare',
  'colt',
  'hart',
  'doe',
  'ram',
  'bull',
  'boar',
  'buck',
  'jay',
  'owl',
  'kite',
  'ibis',
  'tern',
  'gull',
  'finch',
  'robin',
  'shrike',
  'mink',
  'seal',
  'whale',
  'shark',
  'osprey',
  'badger',
  'orca',
];

/**
 * Pick a random element from an array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a candidate team ID (adjective-animal)
 */
function generateCandidate() {
  return `${pickRandom(ADJECTIVES)}-${pickRandom(ANIMALS)}`;
}

/**
 * Generate a unique team ID with collision detection.
 *
 * Retries up to 5 times. If all attempts collide, appends a random
 * 2-digit number (e.g., "swift-otter-42").
 *
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client instance
 * @returns {Promise<string>} Unique team ID
 */
export async function generateTeamId(prisma) {
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = generateCandidate();
    const existing = await prisma.team.findUnique({
      where: { generatedId: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  // All retries exhausted -- append a random 2-digit number
  const suffix = Math.floor(Math.random() * 90 + 10); // 10-99
  const fallback = `${generateCandidate()}-${suffix}`;

  // One final check (extremely unlikely to collide again)
  const existing = await prisma.team.findUnique({
    where: { generatedId: fallback },
    select: { id: true },
  });

  if (!existing) {
    return fallback;
  }

  // Last resort: use timestamp suffix
  return `${generateCandidate()}-${Date.now().toString(36).slice(-4)}`;
}
