# RowLab Database Schema Documentation

## Overview

RowLab uses PostgreSQL with Prisma ORM for a multi-tenant team management system for rowing teams. The schema supports athlete management, workout tracking, lineup creation, racing data, training plans, and integration with external services like Concept2 and Strava.

**Key Features:**
- Multi-tenant architecture with team isolation
- Managed and linked athlete profiles
- Erg workout import from Concept2 and Strava
- Seat racing and selection system
- Training plan management with assignments
- Regatta and race result tracking
- On-water session recording by coxswains
- Subscription and billing management

---

## Entity Relationship Overview

### Core Hierarchy
```
User
  ├─> TeamMember (role: OWNER, COACH, ATHLETE)
  │     └─> Team
  └─> Athlete (optional link for self-managed profiles)
        └─> Team
```

### Authentication & Access
```
User
  ├─> RefreshToken (JWT rotation)
  ├─> Concept2Auth (OAuth integration)
  └─> StravaAuth (OAuth integration)

Team
  └─> Invitation (email-based team joining)
```

### Athlete Performance Data
```
Athlete
  ├─> ErgTest (2k, 6k, 30min tests)
  ├─> Workout (erg sessions from C2/Strava/manual)
  ├─> AthleteRating (ELO-based rankings)
  └─> AthleteTelemetry (oarlock sensor data)

Workout
  └─> WorkoutTelemetry (time series data)
```

### Lineup Management
```
Team
  ├─> Lineup
  │     ├─> LineupAssignment (athlete -> seat)
  │     └─> RaceResult
  ├─> Shell (physical boats)
  └─> BoatConfig (boat class templates)
```

### Seat Racing System
```
Team
  └─> SeatRaceSession
        └─> SeatRacePiece
              └─> SeatRaceBoat
                    └─> SeatRaceAssignment (athlete -> seat)
```

### Racing & Competition
```
Team
  └─> Regatta
        └─> Race
              └─> RaceResult
                    └─> Lineup (optional link to own team lineup)

TeamSpeedEstimate (calculated from race results)
ExternalTeam (opponent teams)
```

### Training Plans
```
Team
  └─> TrainingPlan
        ├─> PlannedWorkout (scheduled workouts)
        │     └─> WorkoutCompletion (athlete completion tracking)
        └─> WorkoutAssignment (plan assigned to athlete)
```

### On-Water Sessions
```
Team
  └─> WaterSession
        └─> BoatSession (per boat)
              └─> WaterPiece (individual pieces/intervals)
```

### Communication & Calendar
```
Team
  ├─> Announcement
  │     └─> AnnouncementRead (read receipts)
  └─> CalendarEvent
        └─> WaterSession (optional link)
```

---

## Model Documentation

### Core Models

#### User
**Purpose:** Represents a person in the system. Can be a coach, athlete, or admin. Users can be members of multiple teams.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `email` | String? | Unique email (optional for admin accounts) |
| `username` | String? | Unique username (for admin non-email login) |
| `passwordHash` | String | Bcrypt-hashed password |
| `name` | String | Display name |
| `isAdmin` | Boolean | System admin flag (default: false) |
| `status` | String | Account status (active, suspended) |
| `createdAt` | DateTime | Registration timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Has many `TeamMember` (membership in multiple teams)
- Has many `RefreshToken` (JWT tokens)
- Has many `Announcement` (authored announcements)
- Has one `UserSettings` (preferences)
- Has one `Concept2Auth` (OAuth connection)
- Has one `StravaAuth` (OAuth connection)
- Has many `BoatSession` (as coxswain)
- Has many `TrainingPlan` (as creator)
- Has many `WorkoutAssignment` (as assigner)

**Indexes:**
- `email` (unique)
- `username` (unique)

**Example Use Cases:**
- A coach can be a member of multiple teams with different roles
- An athlete can link their user account to their athlete profile
- Admins can manage system-wide settings

---

#### Team
**Purpose:** Represents a rowing team (school, club, organization). Teams are isolated tenants in the system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String | Team name |
| `slug` | String | URL-safe identifier (unique) |
| `inviteCode` | String? | Unique code for joining team |
| `isPublic` | Boolean | Public visibility (default: false) |
| `visibilitySetting` | String | Privacy level (open, coaches_only, opt_in) |
| `settings` | Json | Team-specific configuration |
| `aiModel` | String? | Preferred AI model (e.g., "phi4-mini-reasoning:3.8b") |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Has many `TeamMember` (coaches, athletes)
- Has many `Athlete` (roster)
- Has many `Invitation` (pending joins)
- Has many `Lineup` (boat lineups)
- Has many `ErgTest` (performance tests)
- Has many `Workout` (training sessions)
- Has many `Announcement` (team communications)
- Has many `Shell` (physical boats)
- Has many `BoatConfig` (boat templates)
- Has many `SeatRaceSession` (selection events)
- Has many `Regatta` (race events)
- Has many `TeamSpeedEstimate` (performance estimates)
- Has one `Subscription` (billing)
- Has many `CalendarEvent` (schedule)
- Has many `WaterSession` (on-water training)
- Has many `TrainingPlan` (training programs)

**Indexes:**
- `slug` (unique)
- `inviteCode` (unique)

**Example Use Cases:**
- Each college rowing team has its own isolated data
- Teams can customize visibility settings for athlete privacy
- Teams can specify preferred AI models for analysis

---

#### TeamMember
**Purpose:** Junction table linking users to teams with specific roles. Defines access permissions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Foreign key to User |
| `teamId` | String | Foreign key to Team |
| `role` | String | Role in team (OWNER, COACH, ATHLETE) |
| `createdAt` | DateTime | Membership start timestamp |

**Relationships:**
- Belongs to `User`
- Belongs to `Team`
- Has many `WorkoutAssignment` (assigned training plans)
- Has many `WorkoutCompletion` (completed workouts)

**Constraints:**
- Unique composite: `(userId, teamId)` - user can only have one role per team
- Cascade delete when user or team is deleted

**Indexes:**
- `(userId, teamId)` (unique)

**Example Use Cases:**
- A coach has COACH role in their team
- An athlete who is also on the coaching staff has COACH role
- Team owner has OWNER role with full permissions

---

### Authentication & Access Models

#### RefreshToken
**Purpose:** Manages JWT refresh tokens with rotation and family tracking for security.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Foreign key to User |
| `tokenHash` | String | SHA-256 hash of token (unique) |
| `familyId` | String | Token family for rotation detection |
| `expiresAt` | DateTime | Expiration timestamp |
| `revokedAt` | DateTime? | Revocation timestamp (if revoked) |
| `createdAt` | DateTime | Creation timestamp |

**Relationships:**
- Belongs to `User`

**Constraints:**
- Cascade delete when user is deleted

**Indexes:**
- `tokenHash` (unique)
- `userId`
- `familyId`

**Security Features:**
- Token rotation: new tokens issued on refresh
- Family tracking: detects token reuse attacks
- Revocation: tokens can be invalidated

---

#### Invitation
**Purpose:** Email-based team invitation system with claim flow for managed athletes.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `athleteId` | String? | Foreign key to Athlete (for claim flow) |
| `email` | String | Invitee email address |
| `tokenHash` | String | SHA-256 hash of invitation token (unique) |
| `expiresAt` | DateTime | Expiration timestamp |
| `status` | String | Invitation status (pending, claimed, expired, revoked) |
| `createdAt` | DateTime | Creation timestamp |

**Relationships:**
- Belongs to `Team`
- Belongs to `Athlete` (optional - for linking managed athlete to user)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `tokenHash` (unique)

**Example Use Cases:**
- Coach creates managed athlete profile, then sends invitation
- Athlete claims invitation to link their user account to profile
- Invitations expire after set period for security

---

#### Concept2Auth
**Purpose:** Stores OAuth credentials for Concept2 Logbook integration with automatic workout sync.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Primary key and foreign key to User |
| `c2UserId` | String | Concept2 user ID |
| `username` | String? | Concept2 username |
| `accessToken` | String (Text) | OAuth access token (encrypted) |
| `refreshToken` | String (Text) | OAuth refresh token (encrypted) |
| `tokenExpiresAt` | DateTime | Token expiration timestamp |
| `lastSyncedAt` | DateTime? | Last successful sync timestamp |
| `syncEnabled` | Boolean | Auto-sync toggle (default: true) |
| `createdAt` | DateTime | Connection timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `User` (one-to-one)

**Constraints:**
- Cascade delete when user is deleted

**Indexes:**
- `c2UserId`

**Security:**
- Tokens are encrypted at rest
- Automatic token refresh before expiration
- User can disable sync without disconnecting

---

#### StravaAuth
**Purpose:** Stores OAuth credentials for Strava integration with bidirectional sync capabilities.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Primary key and foreign key to User |
| `stravaAthleteId` | BigInt | Strava athlete ID |
| `username` | String? | Strava display name |
| `accessToken` | String (Text) | OAuth access token (encrypted) |
| `refreshToken` | String (Text) | OAuth refresh token (encrypted) |
| `tokenExpiresAt` | DateTime | Token expiration timestamp |
| `lastSyncedAt` | DateTime? | Last Strava→RowLab sync timestamp |
| `syncEnabled` | Boolean | Auto-sync toggle (default: true) |
| `scope` | String? | OAuth scopes granted |
| `c2ToStravaEnabled` | Boolean | C2→Strava upload toggle (default: false) |
| `c2ToStravaTypes` | Json | Activity types to sync (default: {}) |
| `lastC2SyncedAt` | DateTime? | Last C2→Strava sync timestamp |
| `createdAt` | DateTime | Connection timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `User` (one-to-one)

**Constraints:**
- Cascade delete when user is deleted

**Indexes:**
- `stravaAthleteId`

**Features:**
- **Strava→RowLab sync:** Import activities from Strava
- **C2→Strava sync:** Upload Concept2 workouts to Strava
- Selective activity type syncing (rower, bikeerg, skierg)
- Granular control over sync direction

---

### Athlete Performance Models

#### Athlete
**Purpose:** Represents an athlete profile within a team. Can be "managed" (coach-created) or "linked" (user-controlled).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `userId` | String? | Foreign key to User (NULL = managed by coach) |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `email` | String? | Email for invitations |
| `side` | String? | Rowing side (Port, Starboard, Both, Cox) |
| `isManaged` | Boolean | Coach-managed profile (default: true) |
| `concept2UserId` | String? | Concept2 user ID for sync |
| `weightKg` | Decimal(5,2)? | Current weight |
| `heightCm` | Int? | Height in centimeters |
| `createdAt` | DateTime | Profile creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Has many `ErgTest` (performance tests)
- Has many `Workout` (training sessions)
- Has many `LineupAssignment` (boat positions)
- Has many `Invitation` (for claiming profile)
- Has many `AthleteRating` (rankings)
- Has many `AthleteTelemetry` (sensor data)
- Has many `SeatRaceAssignment` (seat race positions)

**Constraints:**
- Unique composite: `(teamId, lastName, firstName)` - no duplicate names per team
- Cascade delete when team is deleted

**Indexes:**
- `(teamId, lastName, firstName)` (unique)
- `teamId`

**Example Use Cases:**
- **Managed athlete:** Coach creates profile for high school athlete without email
- **Linked athlete:** College athlete links their user account to profile
- **Transition:** Managed athlete receives invitation, claims profile, becomes linked

---

#### ErgTest
**Purpose:** Records formal erg test results (2k, 6k, 30min, 500m sprints) for performance tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `athleteId` | String | Foreign key to Athlete |
| `teamId` | String | Foreign key to Team |
| `testType` | String | Test type (2k, 6k, 30min, 500m) |
| `testDate` | DateTime | Test date |
| `distanceM` | Int? | Distance in meters |
| `timeSeconds` | Decimal(10,1) | Total time |
| `splitSeconds` | Decimal(6,1)? | Average split (per 500m) |
| `watts` | Int? | Average watts |
| `strokeRate` | Int? | Average stroke rate |
| `weightKg` | Decimal(5,2)? | Weight at test time |
| `notes` | String? | Additional notes |
| `createdAt` | DateTime | Record creation timestamp |

**Relationships:**
- Belongs to `Athlete`
- Belongs to `Team`

**Constraints:**
- Cascade delete when athlete or team is deleted

**Indexes:**
- `teamId`
- `athleteId`

**Example Use Cases:**
- Track athlete progress over season
- Compare 2k times across team
- Weight-adjusted performance calculations

---

#### Workout
**Purpose:** Records individual training sessions from various sources (Concept2, Strava, manual entry, CSV import, Bluetooth, FIT files).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `athleteId` | String? | Foreign key to Athlete (optional) |
| `userId` | String? | Foreign key to User (for user-level syncs) |
| `teamId` | String | Foreign key to Team |
| `source` | String | Import source (manual, concept2_sync, strava_sync, csv_import, bluetooth, fit_import) |
| `type` | String? | Workout type (on_water, erg, strength, cardio, other) |
| `c2LogbookId` | String? | Concept2 Logbook ID (unique) |
| `stravaActivityId` | String? | Strava activity ID (unique) |
| `date` | DateTime | Workout date |
| `distanceM` | Int? | Distance in meters |
| `durationSeconds` | Decimal(10,1)? | Duration |
| `strokeRate` | Int? | Average stroke rate |
| `calories` | Int? | Calories burned |
| `dragFactor` | Int? | Erg drag factor |
| `deviceInfo` | Json? | Device metadata |
| `rawData` | Json? | Raw import data |
| `createdAt` | DateTime | Record creation timestamp |

**Relationships:**
- Belongs to `Athlete` (optional)
- Belongs to `Team`
- Has one `WorkoutTelemetry` (detailed time series data)
- Has many `WorkoutCompletion` (link to training plan)

**Constraints:**
- Cascade delete when athlete or team is deleted
- `c2LogbookId` unique (prevents duplicate imports)
- `stravaActivityId` unique (prevents duplicate imports)

**Indexes:**
- `teamId`
- `athleteId`
- `userId`
- `c2LogbookId` (unique)
- `stravaActivityId` (unique)

**Example Use Cases:**
- Automatic import from Concept2 via webhook
- Manual entry by coach for athletes without devices
- CSV bulk import for historical data
- Bluetooth real-time capture during workout

---

#### WorkoutTelemetry
**Purpose:** Stores time series data for detailed workout analysis (watts, heart rate, stroke rate, force curves).

| Field | Type | Description |
|-------|------|-------------|
| `workoutId` | String | Primary key and foreign key to Workout |
| `timeSeriesS` | Decimal(10,1)[] | Timestamp array (seconds) |
| `wattsSeries` | Int[] | Power output array |
| `heartRateSeries` | Int[] | Heart rate array (bpm) |
| `strokeRateSeries` | Int[] | Stroke rate array (spm) |
| `forceCurves` | Json? | Force curve data per stroke |

**Relationships:**
- Belongs to `Workout` (one-to-one)

**Constraints:**
- Cascade delete when workout is deleted

**Example Use Cases:**
- Detailed post-workout analysis
- Stroke-by-stroke breakdown
- Heart rate zone analysis
- Force curve technique analysis

---

#### AthleteRating
**Purpose:** Stores calculated performance ratings (ELO from seat racing, combined scores) for athlete ranking and selection.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `athleteId` | String | Foreign key to Athlete |
| `teamId` | String | Foreign key to Team |
| `ratingType` | String | Rating type (seat_race_elo, combined) |
| `ratingValue` | Decimal(8,2) | Rating value (default: 1000) |
| `confidenceScore` | Decimal(4,3)? | Confidence in rating (0-1) |
| `racesCount` | Int | Number of races included (default: 0) |
| `lastCalculatedAt` | DateTime | Last calculation timestamp |

**Relationships:**
- Belongs to `Athlete`

**Constraints:**
- Unique composite: `(athleteId, ratingType)` - one rating per type per athlete
- Cascade delete when athlete is deleted

**Indexes:**
- `(athleteId, ratingType)` (unique)

**Example Use Cases:**
- Seat race ELO rankings for lineup selection
- Combined scores incorporating erg tests and race results
- Confidence scores adjust with more data points

---

#### AthleteTelemetry
**Purpose:** Stores oarlock sensor data (Empower, Peach, NK) for technique analysis.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `athleteId` | String | Foreign key to Athlete |
| `sessionDate` | DateTime | Session date |
| `source` | String | Sensor source (empower, peach, nk) |
| `seatNumber` | Int? | Seat position in boat |
| `avgWatts` | Decimal(6,2)? | Average power output |
| `peakWatts` | Decimal(6,2)? | Peak power output |
| `workPerStroke` | Decimal(8,2)? | Work per stroke (joules) |
| `slipDegrees` | Decimal(5,2)? | Blade slip at catch |
| `washDegrees` | Decimal(5,2)? | Blade wash at finish |
| `catchAngle` | Decimal(5,2)? | Catch angle |
| `finishAngle` | Decimal(5,2)? | Finish angle |
| `peakForceAngle` | Decimal(5,2)? | Angle of peak force |
| `techScore` | Decimal(5,2)? | Overall technique score |
| `createdAt` | DateTime | Record creation timestamp |

**Relationships:**
- Belongs to `Athlete`

**Constraints:**
- Cascade delete when athlete is deleted

**Indexes:**
- `athleteId`

**Example Use Cases:**
- Compare technique metrics across athletes
- Track individual technique improvement
- Identify athletes with optimal force application

---

### Lineup Management Models

#### Lineup
**Purpose:** Represents a boat lineup configuration with seat assignments.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `name` | String | Lineup name (e.g., "Varsity 8+ A") |
| `notes` | String? | Additional notes |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Has many `LineupAssignment` (athlete seat assignments)
- Has many `RaceResult` (race performance)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`

**Example Use Cases:**
- Create multiple lineup variations for comparison
- Track performance of specific lineups over time
- Link lineups to race results

---

#### LineupAssignment
**Purpose:** Assigns an athlete to a specific seat in a lineup.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `lineupId` | String | Foreign key to Lineup |
| `athleteId` | String | Foreign key to Athlete |
| `boatClass` | String | Boat class (8+, 4+, 4-, 2-, 1x) |
| `shellName` | String? | Specific shell name |
| `seatNumber` | Int | Seat number (1=Bow, 8=Stroke, 9=Cox) |
| `side` | String | Rowing side (Port, Starboard) |
| `isCoxswain` | Boolean | Coxswain flag (default: false) |

**Relationships:**
- Belongs to `Lineup`
- Belongs to `Athlete`

**Constraints:**
- Cascade delete when lineup is deleted

**Example Use Cases:**
- Assign stroke seat to strongest athlete
- Balance port/starboard sides
- Track coxswain assignments

---

#### Shell
**Purpose:** Represents a physical rowing shell owned by the team.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `name` | String | Shell name |
| `boatClass` | String | Boat class (8+, 4+, etc.) |
| `notes` | String? | Additional notes (condition, brand) |

**Relationships:**
- Belongs to `Team`

**Constraints:**
- Unique composite: `(teamId, name)` - no duplicate shell names per team
- Cascade delete when team is deleted

**Indexes:**
- `(teamId, name)` (unique)

**Example Use Cases:**
- Track team's fleet of boats
- Link shells to lineups and sessions
- Record boat condition and maintenance notes

---

#### BoatConfig
**Purpose:** Template for boat configurations (number of seats, coxswain presence).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `name` | String | Config name (e.g., "Varsity 8+") |
| `numSeats` | Int | Number of rowing seats |
| `hasCoxswain` | Boolean | Coxswain presence |

**Relationships:**
- Belongs to `Team`

**Constraints:**
- Unique composite: `(teamId, name)` - no duplicate configs per team
- Cascade delete when team is deleted

**Indexes:**
- `(teamId, name)` (unique)

**Example Use Cases:**
- Define standard boat configurations for team
- Use as templates for creating lineups
- Standardize boat class naming

---

### Seat Racing Models

#### SeatRaceSession
**Purpose:** Represents a seat racing session for athlete selection and ranking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `date` | DateTime | Session date |
| `location` | String? | Location (body of water) |
| `conditions` | String? | Water conditions (calm, variable, rough) |
| `boatClass` | String | Boat class (8+, 4+, 4-, 2-) |
| `description` | String? | Session notes |
| `createdAt` | DateTime | Creation timestamp |

**Relationships:**
- Belongs to `Team`
- Has many `SeatRacePiece` (individual race pieces)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`

**Example Use Cases:**
- Organize formal seat racing events
- Track conditions affecting results
- Group related pieces together

---

#### SeatRacePiece
**Purpose:** Individual race piece within a seat racing session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `sessionId` | String | Foreign key to SeatRaceSession |
| `sequenceOrder` | Int | Order in session |
| `distanceMeters` | Int? | Race distance |
| `direction` | String? | Direction (upstream, downstream) |
| `notes` | String? | Piece notes |

**Relationships:**
- Belongs to `SeatRaceSession`
- Has many `SeatRaceBoat` (boats in piece)

**Constraints:**
- Cascade delete when session is deleted

**Example Use Cases:**
- Multiple pieces with athlete swaps
- Account for direction (upstream vs downstream)
- Sequential ordering of pieces

---

#### SeatRaceBoat
**Purpose:** Represents a boat in a specific seat race piece.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `pieceId` | String | Foreign key to SeatRacePiece |
| `name` | String | Boat identifier ("Boat A", "Boat B") |
| `shellName` | String? | Physical shell used |
| `finishTimeSeconds` | Decimal(10,2)? | Finish time |
| `handicapSeconds` | Decimal(5,2) | Handicap applied (default: 0) |

**Relationships:**
- Belongs to `SeatRacePiece`
- Has many `SeatRaceAssignment` (athlete positions)

**Constraints:**
- Cascade delete when piece is deleted

**Example Use Cases:**
- Compare two boats head-to-head
- Apply handicaps for equipment differences
- Track which athletes were in which boat

---

#### SeatRaceAssignment
**Purpose:** Assigns an athlete to a seat in a seat race boat.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `boatId` | String | Foreign key to SeatRaceBoat |
| `athleteId` | String | Foreign key to Athlete |
| `seatNumber` | Int | Seat number (1=Bow, 8=Stroke, 9=Cox) |
| `side` | String | Rowing side (Port, Starboard, Cox) |

**Relationships:**
- Belongs to `SeatRaceBoat`
- Belongs to `Athlete`

**Constraints:**
- Cascade delete when boat is deleted

**Example Use Cases:**
- Record exact lineup for each boat in race
- Calculate ELO changes based on head-to-head results
- Track athlete performance in different positions

---

### Racing & Competition Models

#### Regatta
**Purpose:** Represents a racing event with multiple races.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `name` | String | Regatta name |
| `location` | String? | Venue |
| `date` | DateTime | Event date |
| `courseType` | String? | Course type (2000m, 1500m, head) |
| `conditions` | Json? | Race conditions (wind, temp, current) |
| `description` | String? | Event notes |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Has many `Race` (events within regatta)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`

**Example Use Cases:**
- Track team's racing schedule
- Record regatta conditions
- Group related races together

---

#### Race
**Purpose:** Individual race within a regatta.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `regattaId` | String | Foreign key to Regatta |
| `eventName` | String | Event name (e.g., "Women's Varsity 8+") |
| `boatClass` | String | Boat class |
| `distanceMeters` | Int | Race distance (default: 2000) |
| `isHeadRace` | Boolean | Head race flag (default: false) |
| `scheduledTime` | DateTime? | Scheduled start time |

**Relationships:**
- Belongs to `Regatta`
- Has many `RaceResult` (results for each team)

**Constraints:**
- Cascade delete when regatta is deleted

**Example Use Cases:**
- Track multiple events at same regatta
- Distinguish sprint vs head races
- Schedule race times

---

#### RaceResult
**Purpose:** Records result for a team in a specific race.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `raceId` | String | Foreign key to Race |
| `teamName` | String | Competing team name |
| `isOwnTeam` | Boolean | Own team flag (default: false) |
| `lineupId` | String? | Foreign key to Lineup (for own team) |
| `finishTimeSeconds` | Decimal(10,2)? | Finish time |
| `place` | Int? | Placement in race |
| `marginBackSeconds` | Decimal(8,2)? | Time behind winner |
| `rawSpeed` | Decimal(6,4)? | Raw speed (m/s) |
| `adjustedSpeed` | Decimal(6,4)? | Normalized speed (adjusted for conditions) |

**Relationships:**
- Belongs to `Race`
- Belongs to `Lineup` (optional - for own team)

**Constraints:**
- Cascade delete when race is deleted

**Example Use Cases:**
- Record own team results with lineup reference
- Track opponent performance
- Calculate speed adjustments for conditions

---

#### ExternalTeam
**Purpose:** Represents opponent teams for tracking and comparison.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String | Team name (unique) |
| `conference` | String? | Conference affiliation |
| `division` | String? | Division (D1, D2, D3, Club) |
| `createdAt` | DateTime | Creation timestamp |

**Constraints:**
- `name` unique across all external teams

**Indexes:**
- `name` (unique)

**Example Use Cases:**
- Track opponents across multiple regattas
- Filter results by conference or division
- Build opponent performance database

---

#### TeamSpeedEstimate
**Purpose:** Calculated speed estimates for team boats based on race results.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `boatClass` | String | Boat class |
| `season` | String? | Season (e.g., "Spring 2025") |
| `rawSpeed` | Decimal(6,4)? | Raw speed (m/s) |
| `adjustedSpeed` | Decimal(6,4)? | Normalized speed |
| `confidenceScore` | Decimal(4,3)? | Confidence in estimate (0-1) |
| `sampleCount` | Int | Number of races included (default: 0) |
| `lastCalculatedAt` | DateTime | Last calculation timestamp |

**Relationships:**
- Belongs to `Team`

**Constraints:**
- Unique composite: `(teamId, boatClass, season)` - one estimate per boat class per season
- Cascade delete when team is deleted

**Indexes:**
- `(teamId, boatClass, season)` (unique)

**Example Use Cases:**
- Track team speed improvement over season
- Compare performance across boat classes
- Confidence increases with more race data

---

### Billing & Subscription Models

#### Subscription
**Purpose:** Manages team subscription plans and Stripe billing integration.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team (unique) |
| `stripeCustomerId` | String? | Stripe customer ID (unique) |
| `stripeSubscriptionId` | String? | Stripe subscription ID (unique) |
| `plan` | String | Plan tier (free, starter, pro, enterprise) |
| `status` | String | Status (active, past_due, canceled, trialing) |
| `currentPeriodStart` | DateTime? | Current billing period start |
| `currentPeriodEnd` | DateTime? | Current billing period end |
| `cancelAtPeriodEnd` | Boolean | Cancellation flag (default: false) |
| `athleteLimit` | Int | Max athletes (default: 15) |
| `coachLimit` | Int | Max coaches (default: 1) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team` (one-to-one)
- Has many `SubscriptionEvent` (billing history)

**Constraints:**
- `teamId` unique (one subscription per team)
- `stripeCustomerId` unique
- `stripeSubscriptionId` unique
- Cascade delete when team is deleted

**Indexes:**
- `teamId` (unique)
- `stripeCustomerId` (unique)
- `stripeSubscriptionId` (unique)

**Example Use Cases:**
- Free plan: 15 athletes, 1 coach
- Pro plan: unlimited athletes and coaches
- Handle Stripe webhooks for billing events

---

#### SubscriptionEvent
**Purpose:** Audit log for subscription and payment events.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `subscriptionId` | String | Foreign key to Subscription |
| `eventType` | String | Event type (created, updated, canceled, payment_failed, payment_succeeded) |
| `stripeEventId` | String? | Stripe event ID (unique) |
| `data` | Json? | Event data payload |
| `createdAt` | DateTime | Event timestamp |

**Relationships:**
- Belongs to `Subscription`

**Constraints:**
- `stripeEventId` unique (idempotent webhook processing)
- Cascade delete when subscription is deleted

**Indexes:**
- `subscriptionId`
- `stripeEventId` (unique)

**Example Use Cases:**
- Track billing history
- Debug payment issues
- Generate usage reports

---

### Calendar & Communication Models

#### CalendarEvent
**Purpose:** Team calendar for practices, tests, regattas, meetings, and rest days.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `title` | String | Event title |
| `description` | String? | Event description |
| `eventType` | String | Event type (erg-test, erg-pieces, steady-state, water, lift, rest, meeting, regatta) |
| `date` | DateTime | Event date |
| `startTime` | String? | Start time (HH:MM format) |
| `endTime` | String? | End time (HH:MM format) |
| `location` | String? | Location |
| `completed` | Boolean | Completion flag (default: false) |
| `notes` | String? | Additional notes |
| `visibility` | String | Visibility (all, coaches) - default: all |
| `createdById` | String | Creator user ID |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Has many `WaterSession` (linked on-water sessions)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`
- `date`

**Example Use Cases:**
- Schedule erg tests visible to all
- Create coach-only meetings
- Link water sessions to calendar events
- Mark events as completed after occurring

---

#### Announcement
**Purpose:** Team announcements and communications with read receipts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `authorId` | String | Foreign key to User |
| `title` | String | Announcement title |
| `content` | String | Announcement content |
| `priority` | String | Priority level (normal, important, urgent) |
| `visibleTo` | String | Visibility (all, athletes, coaches) - default: all |
| `pinned` | Boolean | Pin to top flag (default: false) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Belongs to `User` (author)
- Has many `AnnouncementRead` (read receipts)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`

**Example Use Cases:**
- Urgent announcements about weather cancellations
- Pin important deadline announcements
- Track which athletes have read announcements

---

#### AnnouncementRead
**Purpose:** Tracks which users have read which announcements.

| Field | Type | Description |
|-------|------|-------------|
| `announcementId` | String | Foreign key to Announcement (composite PK) |
| `userId` | String | Foreign key to User (composite PK) |
| `readAt` | DateTime | Read timestamp (default: now) |

**Relationships:**
- Belongs to `Announcement`

**Constraints:**
- Composite primary key: `(announcementId, userId)`
- Cascade delete when announcement is deleted

**Indexes:**
- `(announcementId, userId)` (primary key)

**Example Use Cases:**
- Coach sees who has read urgent announcement
- Mark announcement as read when opened
- Filter unread announcements for user

---

### On-Water Session Models

#### WaterSession
**Purpose:** Represents an on-water training session with multiple boats.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `teamId` | String | Foreign key to Team |
| `date` | DateTime | Session date (default: now) |
| `startTime` | DateTime? | Actual start time |
| `endTime` | DateTime? | Actual end time |
| `location` | String? | Body of water |
| `conditions` | String? | Weather and water conditions |
| `notes` | String? | Session notes |
| `calendarEventId` | String? | Foreign key to CalendarEvent |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Belongs to `CalendarEvent` (optional)
- Has many `BoatSession` (individual boats)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`
- `date`

**Example Use Cases:**
- Record practice session with multiple boats
- Link to scheduled calendar event
- Track conditions for each session

---

#### BoatSession
**Purpose:** Records data for a specific boat within a water session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `waterSessionId` | String | Foreign key to WaterSession |
| `boatId` | String? | Foreign key to BoatConfig/Lineup |
| `boatName` | String | Boat identifier |
| `coxswainId` | String? | Foreign key to User (coxswain) |
| `notes` | String? | Boat-specific notes |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `WaterSession`
- Belongs to `User` (coxswain)
- Has many `WaterPiece` (workout pieces)

**Constraints:**
- Cascade delete when water session is deleted

**Indexes:**
- `waterSessionId`
- `coxswainId`

**Example Use Cases:**
- Coxswain records data for their boat
- Track multiple boats in same session
- Link pieces to specific boat

---

#### WaterPiece
**Purpose:** Individual workout piece within a boat session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `boatSessionId` | String | Foreign key to BoatSession |
| `pieceNumber` | Int | Piece sequence number |
| `distance` | Int? | Distance in meters |
| `timeSeconds` | Decimal(10,1)? | Piece time |
| `strokeRate` | Int? | Average stroke rate |
| `pieceType` | String? | Piece type (steady, interval, start, race) |
| `notes` | String? | Piece notes |
| `startTime` | DateTime? | Piece start time |

**Relationships:**
- Belongs to `BoatSession`

**Constraints:**
- Cascade delete when boat session is deleted

**Indexes:**
- `boatSessionId`

**Example Use Cases:**
- Record 10x500m intervals
- Track steady state piece times
- Compare stroke rates across pieces

---

### Training Plan Models

#### TrainingPlan
**Purpose:** Represents a periodized training program with scheduled workouts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String | Plan name |
| `description` | String? | Plan description |
| `teamId` | String | Foreign key to Team |
| `createdBy` | String | Foreign key to User (creator) |
| `startDate` | DateTime? | Plan start date |
| `endDate` | DateTime? | Plan end date |
| `phase` | String? | Training phase (Base, Build, Peak, Taper) |
| `isTemplate` | Boolean | Template flag (default: false) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `Team`
- Belongs to `User` (creator)
- Has many `PlannedWorkout` (scheduled workouts)
- Has many `WorkoutAssignment` (athlete assignments)

**Constraints:**
- Cascade delete when team is deleted

**Indexes:**
- `teamId`
- `createdBy`

**Example Use Cases:**
- Create season-long training plan
- Save plan as template for future seasons
- Assign plan to multiple athletes

---

#### PlannedWorkout
**Purpose:** Individual workout within a training plan.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `planId` | String | Foreign key to TrainingPlan |
| `name` | String | Workout name |
| `type` | String | Workout type (erg, row, cross_train) |
| `description` | String? | Workout description |
| `scheduledDate` | DateTime? | Scheduled date |
| `dayOfWeek` | Int? | Day of week for recurring (0-6) |
| `weekNumber` | Int? | Week number for periodization |
| `duration` | Int? | Duration in seconds |
| `distance` | Int? | Distance in meters |
| `targetPace` | Float? | Target pace (seconds per 500m) |
| `targetHeartRate` | Int? | Target heart rate (bpm) |
| `intensity` | String? | Intensity level (easy, moderate, hard, max) |
| `recurrenceRule` | Json? | Recurrence configuration |
| `order` | Int | Display order (default: 0) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `TrainingPlan`
- Has many `WorkoutCompletion` (athlete completions)

**Constraints:**
- Cascade delete when plan is deleted

**Indexes:**
- `planId`
- `scheduledDate`

**Example Use Cases:**
- Schedule specific workout on date
- Create recurring weekly workout
- Set target pace and heart rate zones

---

#### WorkoutAssignment
**Purpose:** Assigns a training plan to an athlete for a specific period.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `planId` | String | Foreign key to TrainingPlan |
| `athleteId` | String | Foreign key to TeamMember |
| `assignedBy` | String | Foreign key to User (coach) |
| `assignedAt` | DateTime | Assignment timestamp (default: now) |
| `startDate` | DateTime | Assignment start date |
| `endDate` | DateTime? | Assignment end date |
| `status` | String | Status (active, completed, cancelled) - default: active |

**Relationships:**
- Belongs to `TrainingPlan`
- Belongs to `TeamMember` (athlete)
- Belongs to `User` (assigner)

**Constraints:**
- Unique composite: `(planId, athleteId)` - one active assignment per athlete per plan
- Cascade delete when plan or athlete is deleted

**Indexes:**
- `(planId, athleteId)` (unique)
- `athleteId`

**Example Use Cases:**
- Assign training plan to athlete
- Track when plan was assigned and by whom
- Mark plan as completed at end of season

---

#### WorkoutCompletion
**Purpose:** Records athlete completion of a planned workout with compliance tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `plannedWorkoutId` | String | Foreign key to PlannedWorkout |
| `athleteId` | String | Foreign key to TeamMember |
| `workoutId` | String? | Foreign key to Workout (actual workout data) |
| `completedAt` | DateTime | Completion timestamp (default: now) |
| `compliance` | Float? | Compliance score (0-1) - how well targets were met |
| `notes` | String? | Completion notes |

**Relationships:**
- Belongs to `PlannedWorkout`
- Belongs to `TeamMember` (athlete)
- Belongs to `Workout` (optional - actual workout data)

**Constraints:**
- Unique composite: `(plannedWorkoutId, athleteId)` - one completion per athlete per workout
- Cascade delete when planned workout or athlete is deleted

**Indexes:**
- `(plannedWorkoutId, athleteId)` (unique)
- `athleteId`

**Example Use Cases:**
- Mark workout as completed
- Link completion to synced Concept2 workout
- Calculate compliance based on target vs actual

---

### Settings Models

#### UserSettings
**Purpose:** User preferences and personalization settings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Foreign key to User (unique) |
| `emailNotifications` | Boolean | Email notification toggle (default: true) |
| `pushNotifications` | Boolean | Push notification toggle (default: false) |
| `darkMode` | Boolean | Dark mode preference (default: true) |
| `compactView` | Boolean | Compact view toggle (default: false) |
| `autoSave` | Boolean | Auto-save toggle (default: true) |
| `firstName` | String? | First name |
| `lastName` | String? | Last name |
| `role` | String? | Role description |
| `avatar` | String (Text)? | Avatar image data |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

**Relationships:**
- Belongs to `User` (one-to-one)

**Constraints:**
- `userId` unique (one settings record per user)
- Cascade delete when user is deleted

**Indexes:**
- `userId` (unique)

**Example Use Cases:**
- Store user UI preferences
- Manage notification settings
- Profile information

---

## Key Relationships

### User → Team → TeamMember Hierarchy

**Structure:**
```
User (id, email, name)
  └─> TeamMember (userId, teamId, role)
        └─> Team (id, name, slug)
```

**Flow:**
1. User registers account
2. User creates team (becomes OWNER role in TeamMember)
3. User invites other users via Invitation
4. Invited users join team (COACH or ATHLETE role in TeamMember)

**Permissions:**
- **OWNER:** Full team management, billing, delete team
- **COACH:** Manage athletes, lineups, workouts, view all data
- **ATHLETE:** View own data, limited team visibility based on settings

---

### Athlete Profiles and Erg Workouts

**Managed Athlete Flow:**
```
Coach creates Athlete (userId = NULL, isManaged = true)
  └─> Invitation sent to athlete's email
        └─> Athlete claims invitation
              └─> User account created and linked (userId populated)
```

**Linked Athlete Flow:**
```
User account exists
  └─> User joins team via invitation or invite code
        └─> Athlete profile auto-created (userId populated, isManaged = false)
```

**Workout Import Flow:**
```
User connects Concept2Auth
  ├─> Webhook triggered on new logbook entry
  │     └─> Workout created (source: concept2_sync, c2LogbookId populated)
  │           └─> Linked to Athlete via concept2UserId match
  └─> Manual sync button
        └─> Fetch recent workouts from C2 API
```

**Strava Integration:**
```
User connects StravaAuth
  ├─> Strava → RowLab sync (syncEnabled = true)
  │     └─> Webhook triggered on new activity
  │           └─> Workout created (source: strava_sync, stravaActivityId populated)
  └─> C2 → Strava sync (c2ToStravaEnabled = true)
        └─> New Concept2 workout triggers upload to Strava
              └─> Activity created on Strava with RowLab metadata
```

---

### Training Plans and Assignments

**Plan Creation Flow:**
```
Coach creates TrainingPlan
  └─> Coach adds PlannedWorkouts (with schedules, targets)
        └─> Coach assigns WorkoutAssignment to athletes
              └─> Athletes see scheduled workouts in calendar
```

**Completion Flow:**
```
Athlete completes workout
  ├─> Manual: Athlete marks PlannedWorkout as complete
  │     └─> WorkoutCompletion created (no workoutId link)
  └─> Auto: Concept2 sync imports Workout
        └─> System matches to PlannedWorkout by date/type
              └─> WorkoutCompletion created (with workoutId link)
                    └─> Compliance calculated (actual vs target)
```

**Data Relationships:**
```
TrainingPlan
  ├─> PlannedWorkout (what should be done)
  └─> WorkoutAssignment (who should do it)
        └─> WorkoutCompletion (who did it)
              └─> Workout (actual data from erg)
```

---

### Racing Data Structures

**Regatta Hierarchy:**
```
Regatta (event, date, location)
  └─> Race (specific event like "Women's Varsity 8+")
        └─> RaceResult (result for each competing team)
              ├─> Own team: lineupId populated (link to Lineup)
              └─> Opponent: lineupId NULL, teamName as string
```

**Speed Calculation Flow:**
```
RaceResult recorded
  └─> Calculate rawSpeed (distance / time)
        └─> Apply condition adjustments → adjustedSpeed
              └─> Aggregate by team/boatClass/season → TeamSpeedEstimate
                    └─> Confidence increases with more race samples
```

**Lineup Tracking:**
```
Coach creates Lineup
  └─> Coach assigns athletes to seats (LineupAssignment)
        └─> Lineup used in race
              └─> RaceResult created with lineupId
                    └─> Performance tracked for specific lineup
```

---

## Data Flow Diagrams

### 1. User Registration and Team Creation

```
[User Registers]
     ↓
[User.create(email, password, name)]
     ↓
[User clicks "Create Team"]
     ↓
[Team.create(name, slug)]
     ↓
[TeamMember.create(userId, teamId, role: OWNER)]
     ↓
[Subscription.create(teamId, plan: free)]
     ↓
[Team Dashboard Loaded]
```

**Key Points:**
- User account is team-independent
- Creating team automatically adds user as OWNER
- Free subscription created by default
- Team slug must be unique

---

### 2. Erg Workout Import from Concept2

#### Initial OAuth Setup
```
[User clicks "Connect Concept2"]
     ↓
[Redirect to C2 OAuth]
     ↓
[User authorizes app]
     ↓
[C2 redirects back with code]
     ↓
[Exchange code for tokens]
     ↓
[Concept2Auth.create(userId, c2UserId, tokens)]
     ↓
[Register webhook with C2 API]
```

#### Automatic Sync (Webhook)
```
[Athlete completes workout on erg]
     ↓
[C2 Logbook receives workout data]
     ↓
[C2 sends webhook to RowLab]
     ↓
[Webhook handler validates signature]
     ↓
[Fetch workout details from C2 API]
     ↓
[Match c2UserId to Athlete.concept2UserId]
     ↓
[Workout.create(athleteId, teamId, source: concept2_sync)]
     ↓
[WorkoutTelemetry.create(if detailed data available)]
     ↓
[Check for matching PlannedWorkout]
     ↓
[If match found: WorkoutCompletion.create()]
```

#### Manual Sync
```
[User clicks "Sync Now"]
     ↓
[Refresh access token if expired]
     ↓
[Fetch recent workouts from C2 API]
     ↓
[For each workout not in database (check c2LogbookId)]
     ↓
[Workout.create(athleteId, teamId, source: concept2_sync)]
     ↓
[Update Concept2Auth.lastSyncedAt]
```

**Key Points:**
- Workouts are deduplicated by `c2LogbookId`
- Webhook provides real-time sync
- Manual sync as fallback
- Token refresh handled automatically

---

### 3. Training Plan Assignment to Athletes

#### Plan Creation
```
[Coach clicks "Create Training Plan"]
     ↓
[TrainingPlan.create(name, teamId, createdBy, phase)]
     ↓
[Coach adds workouts]
     ↓
[For each workout:]
     ↓
[PlannedWorkout.create(planId, name, type, scheduledDate, targets)]
```

#### Assignment
```
[Coach selects athletes]
     ↓
[For each athlete:]
     ↓
[WorkoutAssignment.create(planId, athleteId, assignedBy, startDate)]
     ↓
[Notification sent to athlete]
```

#### Athlete View
```
[Athlete logs in]
     ↓
[Query WorkoutAssignment WHERE athleteId AND status=active]
     ↓
[For each assignment:]
     ↓
[Query PlannedWorkout WHERE planId AND scheduledDate >= today]
     ↓
[Display calendar with scheduled workouts]
```

#### Completion
```
[Athlete completes workout]
     ↓
[Check if workout matches PlannedWorkout criteria]
     ↓
[WorkoutCompletion.create(plannedWorkoutId, athleteId, workoutId?)]
     ↓
[Calculate compliance:]
     ↓
[Compare actual vs target (pace, distance, duration)]
     ↓
[Store compliance score (0-1)]
     ↓
[Update WorkoutCompletion.compliance]
```

**Key Points:**
- One athlete can have multiple active assignments
- Plans can be templates (reused across seasons)
- Compliance automatically calculated when workout data available
- Coaches can track athlete adherence to training plan

---

### 4. Seat Racing Selection System

#### Session Setup
```
[Coach clicks "New Seat Race"]
     ↓
[SeatRaceSession.create(teamId, date, boatClass, conditions)]
     ↓
[Coach adds pieces]
     ↓
[For each piece:]
     ↓
[SeatRacePiece.create(sessionId, sequenceOrder, distance)]
```

#### Lineup Assignment
```
[For each boat in piece:]
     ↓
[SeatRaceBoat.create(pieceId, name, shellName)]
     ↓
[For each seat:]
     ↓
[SeatRaceAssignment.create(boatId, athleteId, seatNumber, side)]
```

#### Result Recording
```
[Race completed]
     ↓
[Update SeatRaceBoat.finishTimeSeconds]
     ↓
[Calculate time differences between boats]
     ↓
[Identify athletes swapped between boats]
     ↓
[Update AthleteRating using ELO algorithm:]
     ↓
[Winner gains rating, loser loses rating]
     ↓
[Amount based on rating difference and confidence]
     ↓
[AthleteRating.update(ratingValue, racesCount, lastCalculatedAt)]
```

#### Selection Analysis
```
[Coach views rankings]
     ↓
[Query AthleteRating WHERE ratingType=seat_race_elo ORDER BY ratingValue DESC]
     ↓
[Display ranked list with confidence scores]
     ↓
[Coach creates Lineup based on rankings]
```

**Key Points:**
- ELO ratings isolate individual athlete contribution
- Swapping specific athletes between boats enables fair comparison
- Confidence increases with more races
- Results adjust for conditions via handicap system

---

### 5. On-Water Session Recording (Coxswain Flow)

```
[Coxswain opens app before practice]
     ↓
[WaterSession.create(teamId, date, location, conditions)]
     ↓
[BoatSession.create(waterSessionId, boatName, coxswainId)]
     ↓
[Start piece timer]
     ↓
[Piece completed]
     ↓
[WaterPiece.create(boatSessionId, pieceNumber, distance, timeSeconds, strokeRate)]
     ↓
[Repeat for each piece]
     ↓
[End session]
     ↓
[Coach reviews session data]
     ↓
[Compare times across boats]
     ↓
[Track progression over season]
```

**Key Points:**
- Coxswain records data in real-time during practice
- Multiple boats can be tracked in same session
- Piece data enables interval analysis
- Links to calendar events for scheduling

---

## Migration Notes

### Schema Evolution
The schema is designed for evolution with these considerations:

1. **Soft Deletions:** Not implemented by default. Use `status` fields or `revokedAt`/`deletedAt` patterns where needed.

2. **Cascading Deletes:** Extensively used to maintain referential integrity:
   - Deleting a `Team` cascades to all related data
   - Deleting a `User` cascades to memberships and tokens
   - Deleting an `Athlete` cascades to performance data

3. **Optional Fields:** Many fields are nullable to support:
   - Managed athletes (no email initially)
   - Partial data imports (missing metrics)
   - Future features (fields added before UI ready)

4. **JSON Fields:** Used for flexibility:
   - `Team.settings`: Team-specific configuration
   - `Workout.rawData`: Raw import data for debugging
   - `StravaAuth.c2ToStravaTypes`: Activity type sync preferences
   - `CalendarEvent.recurrenceRule`: Recurring event configuration

### Important Migration Considerations

#### Adding New OAuth Providers
Follow the pattern established by `Concept2Auth` and `StravaAuth`:
- One-to-one relationship with `User`
- Store encrypted tokens in `Text` fields
- Include `lastSyncedAt` and `syncEnabled` flags
- Add foreign key index on provider's user ID

#### Extending Performance Data
When adding new telemetry sources:
- Consider if data is per-athlete or per-workout
- Use JSON fields for variable/experimental metrics
- Create dedicated tables for high-volume time series data
- Add `source` field to distinguish data providers

#### Multi-Tenancy Considerations
All team-scoped queries must filter by `teamId`:
```sql
-- Always include teamId in WHERE clause
SELECT * FROM athletes WHERE teamId = ? AND lastName = ?
```

Add `teamId` to indexes for query performance:
```prisma
@@index([teamId, lastName])
```

#### OAuth Token Security
- **Storage:** Tokens are marked as `@db.Text` (encrypted at application layer)
- **Rotation:** Refresh tokens before expiration
- **Revocation:** Include `revokedAt` or `syncEnabled` flags
- **Audit:** Consider adding token usage logging for security

#### Subscription Limits
Enforce limits at application layer:
```javascript
const subscription = await prisma.subscription.findUnique({
  where: { teamId }
})

const athleteCount = await prisma.athlete.count({
  where: { teamId }
})

if (athleteCount >= subscription.athleteLimit) {
  throw new Error('Athlete limit reached')
}
```

#### Unique Constraints
Critical constraints preventing data corruption:
- `(teamId, lastName, firstName)` on `Athlete` - no duplicate names
- `(userId, teamId)` on `TeamMember` - one role per user per team
- `c2LogbookId` on `Workout` - no duplicate C2 imports
- `stravaActivityId` on `Workout` - no duplicate Strava imports
- `(planId, athleteId)` on `WorkoutAssignment` - one active plan assignment

### Migration Best Practices

1. **Never remove columns directly:** Deprecate in code first, remove in later migration
2. **Add columns as nullable:** Make required in later migration after data backfilled
3. **Test cascade deletes carefully:** Can result in large data deletions
4. **Use transactions for multi-step migrations:** Ensure data consistency
5. **Backup before structural changes:** Especially for FK constraint changes

### Index Strategy
Current indexes focus on:
- Foreign key relationships (automatic query optimization)
- Team-scoped queries (`teamId` widely indexed)
- Time-based queries (`date` fields indexed)
- Unique constraints (enforced at database level)

Consider adding indexes for:
- Frequently filtered fields in WHERE clauses
- JOIN conditions beyond foreign keys
- ORDER BY fields with large result sets
- Composite indexes for common query patterns

---

## Performance Considerations

### Query Optimization

1. **Team Isolation:** Always filter by `teamId` first to leverage indexes
2. **Pagination:** Use cursor-based pagination for large result sets
3. **Eager Loading:** Use Prisma's `include` carefully - can cause N+1 queries
4. **Aggregate Queries:** Use database aggregations instead of fetching all data

### Data Volume Estimates (per team)

| Model | Expected Volume | Growth Rate |
|-------|----------------|-------------|
| Athlete | 50-150 | Slow (annual) |
| Workout | 1,000-10,000 | High (daily) |
| WorkoutTelemetry | 1,000-5,000 | Medium (subset of workouts) |
| ErgTest | 200-500 | Slow (seasonal) |
| SeatRaceSession | 10-50 | Slow (seasonal) |
| RaceResult | 50-200 | Medium (seasonal) |
| CalendarEvent | 200-500 | Medium (annual) |

### Archiving Strategy

Consider archiving old data:
- **Workouts:** Archive after 2 years (keep aggregates)
- **Telemetry:** Archive after 1 year (large data volume)
- **RaceResults:** Keep indefinitely (small, historically valuable)
- **Announcements:** Archive after 1 year (keep important/pinned)

---

## Security Considerations

### Row-Level Security
Implement application-layer checks:
- Users can only access teams they're members of
- Athletes only see own data (unless coach)
- Coaches see all team data

### Sensitive Data
Fields requiring encryption:
- `Concept2Auth.accessToken` / `refreshToken`
- `StravaAuth.accessToken` / `refreshToken`
- `User.passwordHash` (bcrypt, not encrypted)

### Audit Logging
Consider adding audit tables for:
- Subscription changes
- Team ownership transfers
- Athlete profile modifications
- Bulk data imports

### API Security
- Always validate `teamId` in request matches user's memberships
- Rate limit OAuth token refresh endpoints
- Validate webhook signatures (Concept2, Strava, Stripe)
- Sanitize user inputs for JSON fields

---

## Future Enhancements

### Planned Schema Additions

1. **Coach Notes System**
   - Private coach notes on athletes
   - Shared notes between coaching staff
   - Tagging system for easy filtering

2. **Injury Tracking**
   - Injury records linked to athletes
   - Recovery timelines
   - Workout modifications

3. **Video Analysis**
   - Video uploads linked to sessions
   - Annotations and markup
   - Technique comparison over time

4. **Parent Portal**
   - Separate user type for parents
   - Limited visibility into athlete data
   - Communication with coaches

5. **Equipment Management**
   - Maintenance logs for shells
   - Equipment assignment tracking
   - Inventory management

### Schema Versioning
Current schema version: `v2.0`
- Track version in database metadata table
- Include version in API responses
- Plan for backward compatibility

---

## Conclusion

This schema supports a comprehensive rowing team management system with:
- Flexible athlete management (managed vs. linked)
- Multiple integration points (Concept2, Strava)
- Advanced performance tracking (erg tests, seat racing, racing results)
- Training plan management with compliance tracking
- On-water session recording
- Multi-tenant architecture with team isolation
- Scalable subscription system

The schema is designed for growth with nullable fields, JSON flexibility, and clear relationship patterns.
