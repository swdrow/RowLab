# Database Schema Documentation

RowLab uses PostgreSQL 14+ with Prisma ORM for type-safe database access. The schema implements a multi-tenant architecture with team-based data isolation.

## Overview

### Technology Stack
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Migration Tool**: Prisma Migrate
- **Schema Location**: `prisma/schema.prisma`

### Schema Organization

The database schema is organized into logical domains:

1. **Core Models** - Users, Teams, Authentication
2. **Athlete Models** - Athlete profiles and Concept2 integration
3. **Performance Models** - Erg tests, workouts, telemetry data
4. **Lineup Models** - Boat configurations and assignments
5. **Racing Models** - Regattas, races, and results
6. **Seat Racing Models** - Selection system with ELO ratings
7. **Communication Models** - Announcements and notifications
8. **Billing Models** - Subscriptions and payments

### Key Design Principles

#### Multi-Tenancy
All data is scoped to teams using `teamId` foreign keys:
```prisma
model Athlete {
  id     String @id @default(uuid())
  teamId String
  team   Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  @@index([teamId])
}
```

#### Cascade Deletes
Related data is automatically deleted when parent is removed:
- Delete Team → Deletes all athletes, tests, lineups, etc.
- Delete Athlete → Deletes all erg tests, assignments, etc.

#### Soft Deletes (Where Needed)
Some models use status fields instead of hard deletes:
```prisma
model Invitation {
  status String @default("pending") // pending, claimed, expired, revoked
}
```

#### UUIDs for IDs
All primary keys use UUIDs for security and distributed systems:
```prisma
id String @id @default(uuid())
```

#### Audit Timestamps
Most models track creation and modification:
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

## Entity Relationship Diagram

```
┌─────────┐
│  User   │──────┐
└─────────┘      │
     │           │
     │ 1:N       │ 1:N
     │           │
     ▼           ▼
┌──────────┐   ┌─────────────┐
│TeamMember│───│    Team     │
└──────────┘   └─────────────┘
                      │
                      │ 1:N
                      ▼
                ┌─────────┐
                │ Athlete │
                └─────────┘
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
        ┌────────┐ ┌────────┐ ┌────────┐
        │ErgTest │ │Lineup  │ │Seat    │
        │        │ │Assign. │ │Race    │
        └────────┘ └────────┘ └────────┘
```

## Schema Statistics

Total Models: 28

| Domain | Models | Purpose |
|--------|--------|---------|
| Core | 4 | Users, teams, authentication |
| Athletes | 2 | Athlete profiles, Concept2 sync |
| Performance | 4 | Erg tests, workouts, telemetry |
| Lineups | 4 | Boat configs, assignments |
| Racing | 5 | Regattas, races, results |
| Seat Racing | 5 | Selection sessions, ELO ratings |
| Communication | 2 | Announcements, read tracking |
| Billing | 2 | Subscriptions, Stripe integration |

## Core Concepts

### User Account vs Athlete Profile

**User**: Platform account with email/password
- Can belong to multiple teams
- Has authentication credentials
- System-level entity

**Athlete**: Rowing profile within a team
- Belongs to one team
- May or may not have user account (managed vs linked)
- Team-scoped entity

**Relationship**:
```
Managed Athlete: Athlete.userId = null (coach creates and manages)
Linked Athlete: Athlete.userId = User.id (athlete claims profile)
```

### Team Isolation

All queries are automatically scoped by team:
```javascript
// Service layer always filters by teamId
const athletes = await prisma.athlete.findMany({
  where: { teamId: req.user.activeTeamId }
});
```

### Role-Based Access Control

Three roles per team membership:
- **OWNER**: Full administrative access
- **COACH**: Manage athletes, data, and lineups
- **ATHLETE**: View own data only

Stored in `TeamMember.role` field.

## Data Types

### Numeric Precision
```prisma
weightKg     Decimal  @db.Decimal(5, 2)  // 999.99 max
timeSeconds  Decimal  @db.Decimal(10, 1) // 10 digits, 1 decimal
splitSeconds Decimal  @db.Decimal(6, 1)  // 99999.9 max
```

### JSON Fields
Flexible data storage for extensibility:
```prisma
settings Json @default("{}")  // Team settings
rawData  Json?                // Concept2 telemetry
```

### Enums via Strings
Enums are stored as strings with validation:
```prisma
side String? // Port, Starboard, Both, Cox
testType String // 2k, 6k, 30min, 500m
```

## Indexes

Performance-critical indexes:
```prisma
@@index([teamId])              // Team isolation
@@index([athleteId])           // Athlete queries
@@index([tokenHash])           // Token lookups
@@unique([teamId, lastName, firstName]) // Duplicate prevention
```

## Constraints

### Unique Constraints
```prisma
@@unique([userId, teamId])              // One membership per user per team
@@unique([athleteId, ratingType])       // One rating per type per athlete
@@unique([teamId, name])                // Unique shell names per team
```

### Foreign Key Constraints
All relations use `onDelete: Cascade` for automatic cleanup:
```prisma
team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
```

## Default Values

```prisma
@default(uuid())        // Auto-generate UUID
@default(now())         // Current timestamp
@default(true)          // Boolean default
@default(1000)          // Numeric default (ELO)
@default("active")      // String default
@default("{}")          // Empty JSON object
```

## Detailed Model Documentation

- [Core Models](./core-models.md) - User, Team, TeamMember, RefreshToken, Invitation
- [Athlete Models](./athlete-models.md) - Athlete, Concept2Auth
- [Performance Models](./performance-models.md) - ErgTest, Workout, WorkoutTelemetry, AthleteTelemetry
- [Lineup Models](./lineup-models.md) - Lineup, LineupAssignment, Shell, BoatConfig
- [Racing Models](./racing-models.md) - Regatta, Race, RaceResult, ExternalTeam, TeamSpeedEstimate
- [Seat Racing Models](./seat-racing-models.md) - SeatRaceSession, SeatRacePiece, SeatRaceBoat, SeatRaceAssignment, AthleteRating
- [Communication Models](./communication-models.md) - Announcement, AnnouncementRead
- [Billing Models](./billing-models.md) - Subscription, SubscriptionEvent

## Migrations

### Running Migrations

**Development:**
```bash
npx prisma migrate dev --name migration_name
```

**Production:**
```bash
npx prisma migrate deploy
```

### Migration History
See [migrations.md](./migrations.md) for complete migration history.

### Recent Migrations
1. `20260118024740_init_v2_schema` - Initial multi-tenant schema
2. `20260118183923_add_seat_racing_tables` - Seat racing system
3. `20260118193028_add_racing_models` - Regatta and race tracking
4. `20260118204653_add_subscriptions` - Billing integration

## Database Maintenance

### Backup Strategy
```bash
# Daily backup
pg_dump -h localhost -U postgres rowlab > backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres rowlab < backup_20260119.sql
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

### Cleanup Operations
```sql
-- Remove expired invitations
DELETE FROM invitations
WHERE status = 'pending' AND "expiresAt" < NOW();

-- Remove revoked refresh tokens
DELETE FROM refresh_tokens
WHERE "revokedAt" IS NOT NULL
  AND "revokedAt" < NOW() - INTERVAL '30 days';
```

## Development Tools

### Prisma Studio
Visual database browser:
```bash
npx prisma studio
```

### Generate Prisma Client
After schema changes:
```bash
npx prisma generate
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

### Seed Database
```bash
npm run seed
```

## Connection Management

### Connection Pool
```javascript
// Prisma automatically manages connection pooling
// Default: 10 connections

// Adjust in DATABASE_URL:
DATABASE_URL="postgresql://user:pass@localhost:5432/rowlab?connection_limit=20"
```

### Connection URL Format
```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

**Options:**
- `connection_limit`: Max connections (default: 10)
- `pool_timeout`: Connection timeout in seconds
- `schema`: PostgreSQL schema (default: public)
- `sslmode`: SSL mode (require, prefer, disable)

## Security Considerations

### SQL Injection Prevention
Prisma automatically parameterizes queries:
```javascript
// Safe - Prisma handles escaping
prisma.athlete.findMany({
  where: { lastName: userInput }
});
```

### Password Storage
- Never store passwords in database
- Only store bcrypt hashes in `User.passwordHash`
- 12 salt rounds for bcrypt

### Sensitive Data
Token hashes stored, not raw tokens:
```javascript
const tokenHash = crypto
  .createHash('sha256')
  .update(rawToken)
  .digest('hex');
```

### Row-Level Security
Implemented in application layer via `teamId` filtering.

## Troubleshooting

### Common Issues

**1. Migration Conflicts**
```bash
# Reset migration state
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy
```

**2. Schema Drift**
```bash
# Check for drift
npx prisma migrate status

# Generate migration from drift
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

**3. Connection Issues**
```bash
# Test connection
npx prisma db pull
```

---

**Prisma Version**: 5.x
**PostgreSQL Version**: 14+
**Last Updated**: 2026-01-19
