import { prisma } from '../db/connection.js';

/**
 * Create a new athlete (managed by coach)
 */
export async function createAthlete(teamId, data) {
  const { firstName, lastName, email, side, canScull, canCox, weightKg, heightCm } = data;

  // Check for duplicate name in team
  const existing = await prisma.athlete.findUnique({
    where: {
      teamId_lastName_firstName: { teamId, lastName, firstName },
    },
  });

  if (existing) {
    throw new Error('Athlete with this name already exists in team');
  }

  const athlete = await prisma.athlete.create({
    data: {
      teamId,
      firstName,
      lastName,
      email: email || null,
      side: side || null,
      canScull: canScull ?? false,
      canCox: canCox ?? false,
      weightKg: weightKg || null,
      heightCm: heightCm || null,
      isManaged: true,
    },
  });

  return formatAthlete(athlete);
}

/**
 * Get all athletes for a team
 */
export async function getAthletes(teamId, { includeStats = false } = {}) {
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    include: includeStats
      ? {
          _count: {
            select: {
              ergTests: true,
              workouts: true,
            },
          },
          ergTests: {
            orderBy: { testDate: 'desc' },
            take: 1,
            select: {
              testType: true,
              timeSeconds: true,
              testDate: true,
            },
          },
        }
      : undefined,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return athletes.map((a) => formatAthlete(a, includeStats));
}

/**
 * Get single athlete by ID
 */
export async function getAthleteById(athleteId, teamId) {
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
    include: {
      _count: {
        select: {
          ergTests: true,
          workouts: true,
        },
      },
      ergTests: {
        orderBy: { testDate: 'desc' },
        take: 5,
      },
      athleteRatings: true,
    },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  return formatAthlete(athlete, true);
}

/**
 * Update athlete details
 */
export async function updateAthlete(athleteId, teamId, updates) {
  // Verify athlete belongs to team
  const existing = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!existing) {
    throw new Error('Athlete not found');
  }

  // If changing name, check for duplicates
  const newFirstName = updates.firstName ?? existing.firstName;
  const newLastName = updates.lastName ?? existing.lastName;

  if (newFirstName !== existing.firstName || newLastName !== existing.lastName) {
    const duplicate = await prisma.athlete.findFirst({
      where: {
        teamId,
        firstName: newFirstName,
        lastName: newLastName,
        NOT: { id: athleteId },
      },
    });

    if (duplicate) {
      throw new Error('Athlete with this name already exists in team');
    }
  }

  const allowedFields = [
    'firstName',
    'lastName',
    'email',
    'side',
    'canScull',
    'canCox',
    'weightKg',
    'heightCm',
    'concept2UserId',
    'avatar',
  ];

  const data = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  const athlete = await prisma.athlete.update({
    where: { id: athleteId },
    data,
  });

  return formatAthlete(athlete);
}

/**
 * Delete athlete
 */
export async function deleteAthlete(athleteId, teamId) {
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  // Only allow deleting managed athletes
  if (!athlete.isManaged) {
    throw new Error('Cannot delete linked athlete account');
  }

  await prisma.athlete.delete({
    where: { id: athleteId },
  });

  return { deleted: true };
}

/**
 * Link athlete to user account (claim flow)
 */
export async function linkAthleteToUser(athleteId, userId, teamId) {
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (athlete.userId) {
    throw new Error('Athlete already linked to a user');
  }

  // Create team membership for user
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: {},
    create: {
      userId,
      teamId,
      role: 'ATHLETE',
    },
  });

  // Link athlete to user
  const updated = await prisma.athlete.update({
    where: { id: athleteId },
    data: {
      userId,
      isManaged: false,
    },
  });

  return formatAthlete(updated);
}

/**
 * Unlink athlete from user account
 */
export async function unlinkAthleteFromUser(athleteId, teamId) {
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!athlete.userId) {
    throw new Error('Athlete is not linked to any user');
  }

  const updated = await prisma.athlete.update({
    where: { id: athleteId },
    data: {
      userId: null,
      isManaged: true,
    },
  });

  return formatAthlete(updated);
}

/**
 * Bulk import athletes
 */
export async function bulkImportAthletes(teamId, athletes) {
  const results = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const data of athletes) {
    try {
      await createAthlete(teamId, data);
      results.created++;
    } catch (error) {
      if (error.message.includes('already exists')) {
        results.skipped++;
      } else {
        results.errors.push({
          athlete: `${data.firstName} ${data.lastName}`,
          error: error.message,
        });
      }
    }
  }

  return results;
}

/**
 * Search athletes in team
 */
export async function searchAthletes(teamId, query) {
  const athletes = await prisma.athlete.findMany({
    where: {
      teamId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return athletes.map((a) => formatAthlete(a));
}

/**
 * Get athletes by side preference
 */
export async function getAthletesBySide(teamId, side) {
  const athletes = await prisma.athlete.findMany({
    where: {
      teamId,
      OR: [{ side }, { side: 'Both' }],
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return athletes.map((a) => formatAthlete(a));
}

/**
 * Format athlete for API response
 */
function formatAthlete(athlete, includeStats = false) {
  const base = {
    id: athlete.id,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    fullName: `${athlete.firstName} ${athlete.lastName}`,
    email: athlete.email,
    side: athlete.side,
    canScull: athlete.canScull ?? false,
    canCox: athlete.canCox ?? false,
    isManaged: athlete.isManaged,
    isLinked: !!athlete.userId,
    weightKg: athlete.weightKg ? Number(athlete.weightKg) : null,
    heightCm: athlete.heightCm,
    country: athlete.country,
    concept2UserId: athlete.concept2UserId,
    avatar: athlete.avatar || null,
    status: athlete.status || 'active',
    classYear: athlete.classYear ?? null,
    createdAt: athlete.createdAt,
    updatedAt: athlete.updatedAt,
  };

  if (includeStats && athlete._count) {
    base.stats = {
      ergTestCount: athlete._count.ergTests,
      workoutCount: athlete._count.workouts,
    };

    if (athlete.ergTests?.length > 0) {
      const latestTest = athlete.ergTests[0];
      base.latestErgTest = {
        testType: latestTest.testType,
        timeSeconds: Number(latestTest.timeSeconds),
        testDate: latestTest.testDate,
      };
    }

    if (athlete.athleteRatings?.length > 0) {
      base.ratings = athlete.athleteRatings.map((r) => ({
        type: r.ratingType,
        value: Number(r.ratingValue),
        confidence: r.confidenceScore ? Number(r.confidenceScore) : null,
        racesCounted: r.racesCounted,
      }));
    }
  }

  return base;
}
