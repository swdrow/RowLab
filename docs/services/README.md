# Services Documentation

The service layer contains the business logic for RowLab, implementing data operations, calculations, and third-party integrations.

## Architecture

### Service Layer Pattern

```
┌─────────────┐
│   Routes    │ ← HTTP handlers, validation, error handling
└─────────────┘
       ↓
┌─────────────┐
│  Services   │ ← Business logic, data operations
└─────────────┘
       ↓
┌─────────────┐
│   Prisma    │ ← Database access
└─────────────┘
```

### Design Principles

1. **Single Responsibility**: Each service handles one domain (athletes, erg tests, etc.)
2. **Team Isolation**: All queries scoped by `teamId`
3. **Error Handling**: Services throw descriptive errors, routes catch and format
4. **Pure Functions**: No side effects where possible
5. **Testability**: Services can be tested independently

## Service Categories

### Core Services
- [Authentication Service](./auth-service.md) - User login, registration, token management
- [Token Service](./token-service.md) - JWT generation, refresh token rotation
- [Invite Service](./invite-service.md) - Team invitations, athlete claiming

### Data Management Services
- [Athlete Service](./athlete-service.md) - Athlete CRUD, search, linking
- [Erg Test Service](./erg-test-service.md) - Erg test management, leaderboards
- [Workout Service](./workout-service.md) - Training data, Concept2 sync
- [Lineup Service](./lineup-service.md) - Boat configuration and assignments
- [Shell Service](./shell-service.md) - Physical boat inventory

### Racing & Selection Services
- [Seat Race Service](./seat-race-service.md) - Seat racing sessions and pieces
- [ELO Rating Service](./elo-rating-service.md) - Athlete rating calculations
- [Margin Calculation Service](./margin-calculation-service.md) - Performance differentials
- [Regatta Service](./regatta-service.md) - Race event management
- [Team Ranking Service](./team-ranking-service.md) - Speed estimates and rankings

### Integration Services
- [CSV Import Service](./csv-import-service.md) - Bulk data imports
- [Concept2 Service](./concept2-service.md) - Concept2 API integration
- [Stripe Service](./stripe-service.md) - Payment processing

### AI Services
- [AI Service](./ai-services.md) - Anthropic Claude API integration
- [AI Lineup Optimizer](./ai-services.md#lineup-optimizer) - Optimal boat configurations

### Utility Services
- [Telemetry Service](./telemetry-service.md) - Oarlock sensor data processing
- [Announcement Service](./announcement-service.md) - Team communications

## Common Patterns

### Service Function Signature

```javascript
/**
 * Service function description
 * @param {string} teamId - Team UUID for isolation
 * @param {Object} data - Input data
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Result object
 * @throws {Error} Descriptive error message
 */
export async function createResource(teamId, data, options = {}) {
  // Validation
  if (!data.required) {
    throw new Error('Required field missing');
  }

  // Database operation
  const resource = await prisma.resource.create({
    data: {
      teamId,
      ...data
    }
  });

  // Format and return
  return formatResource(resource);
}
```

### Error Handling

Services throw errors with descriptive messages:
```javascript
// Not found
throw new Error('Athlete not found');

// Validation
throw new Error('Invalid email format');

// Business logic
throw new Error('Cannot delete linked athlete account');

// Duplicate
throw new Error('Athlete with this name already exists in team');
```

Routes catch and format errors:
```javascript
try {
  const result = await service.createAthlete(teamId, data);
  res.status(201).json({ success: true, data: result });
} catch (error) {
  if (error.message === 'Athlete not found') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: error.message }
    });
  }
  res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Operation failed' }
  });
}
```

### Team Isolation

All queries filtered by team:
```javascript
export async function getAthletes(teamId, options = {}) {
  return await prisma.athlete.findMany({
    where: { teamId }, // Always include teamId
    ...options
  });
}
```

### Data Formatting

Services return formatted data:
```javascript
function formatAthlete(athlete) {
  return {
    id: athlete.id,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    fullName: `${athlete.firstName} ${athlete.lastName}`,
    weightKg: athlete.weightKg ? Number(athlete.weightKg) : null,
    // Format Decimal types to Number
    // Combine related fields
    // Remove internal fields
  };
}
```

### Pagination & Filtering

```javascript
export async function getAthletes(teamId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    includeStats = false,
    side = null
  } = options;

  const where = { teamId };
  if (side) {
    where.OR = [{ side }, { side: 'Both' }];
  }

  const athletes = await prisma.athlete.findMany({
    where,
    skip: offset,
    take: limit,
    include: includeStats ? { _count: { select: { ergTests: true } } } : undefined,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  });

  return athletes.map(a => formatAthlete(a));
}
```

### Transactions

Use Prisma transactions for atomic operations:
```javascript
export async function createLineupWithAssignments(teamId, data) {
  return await prisma.$transaction(async (tx) => {
    // Create lineup
    const lineup = await tx.lineup.create({
      data: {
        teamId,
        name: data.name,
        notes: data.notes
      }
    });

    // Create assignments
    if (data.assignments?.length > 0) {
      await tx.lineupAssignment.createMany({
        data: data.assignments.map(a => ({
          lineupId: lineup.id,
          athleteId: a.athleteId,
          seatNumber: a.seatNumber,
          side: a.side,
          boatClass: a.boatClass
        }))
      });
    }

    // Return with assignments
    return await tx.lineup.findUnique({
      where: { id: lineup.id },
      include: { assignments: true }
    });
  });
}
```

### Bulk Operations

```javascript
export async function bulkImportAthletes(teamId, athletes) {
  const results = {
    created: 0,
    skipped: 0,
    errors: []
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
          error: error.message
        });
      }
    }
  }

  return results;
}
```

## Service Dependencies

### Service Dependency Graph

```
AuthService
├── TokenService
└── InviteService
    └── AthleteService

AthleteService
├── ErgTestService
└── LineupService

SeatRaceService
├── EloRatingService
└── MarginCalculationService

RegattaService
└── TeamRankingService
```

### Circular Dependency Prevention

Use dependency injection or late imports:
```javascript
// Bad: Circular dependency
import { athleteService } from './athleteService.js';

// Good: Import only types or use lazy loading
export async function linkAthlete(athleteId, userId) {
  const { getAthleteById } = await import('./athleteService.js');
  return await getAthleteById(athleteId);
}
```

## Testing Services

### Unit Tests

```javascript
import { createAthlete } from './athleteService';
import { prismaMock } from '../test/prismaMock';

describe('athleteService', () => {
  test('createAthlete creates athlete with valid data', async () => {
    const mockAthlete = {
      id: 'athlete-uuid',
      firstName: 'John',
      lastName: 'Smith',
      teamId: 'team-uuid'
    };

    prismaMock.athlete.create.mockResolvedValue(mockAthlete);

    const result = await createAthlete('team-uuid', {
      firstName: 'John',
      lastName: 'Smith'
    });

    expect(result.id).toBe('athlete-uuid');
    expect(prismaMock.athlete.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: 'John',
        lastName: 'Smith',
        teamId: 'team-uuid'
      })
    });
  });

  test('createAthlete throws on duplicate', async () => {
    prismaMock.athlete.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      createAthlete('team-uuid', {
        firstName: 'John',
        lastName: 'Smith'
      })
    ).rejects.toThrow('already exists');
  });
});
```

### Integration Tests

```javascript
import { createAthlete, getAthletes } from './athleteService';
import { resetDatabase } from '../test/helpers';

describe('athleteService integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test('full athlete lifecycle', async () => {
    const teamId = 'test-team-uuid';

    // Create
    const athlete = await createAthlete(teamId, {
      firstName: 'John',
      lastName: 'Smith',
      side: 'Port'
    });
    expect(athlete.id).toBeDefined();

    // List
    const athletes = await getAthletes(teamId);
    expect(athletes).toHaveLength(1);
    expect(athletes[0].id).toBe(athlete.id);

    // Update
    const updated = await updateAthlete(athlete.id, teamId, {
      side: 'Starboard'
    });
    expect(updated.side).toBe('Starboard');

    // Delete
    await deleteAthlete(athlete.id, teamId);
    const remaining = await getAthletes(teamId);
    expect(remaining).toHaveLength(0);
  });
});
```

## Performance Optimization

### N+1 Query Prevention

Use Prisma `include` to eagerly load relations:
```javascript
// Bad: N+1 queries
const athletes = await prisma.athlete.findMany({ where: { teamId } });
for (const athlete of athletes) {
  athlete.tests = await prisma.ergTest.findMany({
    where: { athleteId: athlete.id }
  });
}

// Good: Single query with join
const athletes = await prisma.athlete.findMany({
  where: { teamId },
  include: {
    ergTests: {
      orderBy: { testDate: 'desc' },
      take: 5
    }
  }
});
```

### Selective Field Loading

```javascript
export async function getAthleteNames(teamId) {
  return await prisma.athlete.findMany({
    where: { teamId },
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  });
}
```

### Caching (Future)

```javascript
import { cache } from '../utils/cache';

export async function getAthletes(teamId, options = {}) {
  const cacheKey = `athletes:${teamId}:${JSON.stringify(options)}`;

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Query database
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    ...options
  });

  // Cache for 5 minutes
  await cache.set(cacheKey, athletes, 300);

  return athletes;
}
```

## Service Documentation Index

- [Authentication Service](./auth-service.md)
- [Token Service](./token-service.md)
- [Athlete Service](./athlete-service.md)
- [Erg Test Service](./erg-test-service.md)
- [Lineup Service](./lineup-service.md)
- [ELO Rating Service](./elo-rating-service.md)
- [Margin Calculation Service](./margin-calculation-service.md)
- [AI Services](./ai-services.md)
- [CSV Import Service](./csv-import-service.md)
- [Concept2 Service](./concept2-service.md)

---

**Last Updated**: 2026-01-19
