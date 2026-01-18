# Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform RowLab from SQLite single-tenant to PostgreSQL multi-tenant with new auth, team management, and design system.

**Architecture:** API-first Express backend with JWT refresh token rotation, PostgreSQL with Row Level Security, React frontend with new dark design system. Team isolation at middleware level.

**Tech Stack:** PostgreSQL, Prisma ORM, Express.js, JWT (jsonwebtoken), bcryptjs, React 18, Tailwind CSS, Zustand, React Query

---

## Phase 1A: Infrastructure Setup

### Task 1: Install PostgreSQL and Create Database

**Files:**
- Modify: `.env` (add PostgreSQL connection)
- Create: `scripts/setup-postgres.sh`

**Step 1: Install PostgreSQL (if not already installed)**

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
```

**Step 2: Create database and user**

```bash
sudo -u postgres psql -c "CREATE USER rowlab WITH PASSWORD 'rowlab_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE rowlab_dev OWNER rowlab;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rowlab_dev TO rowlab;"
```

**Step 3: Update .env file**

Add to `.env`:
```
DATABASE_URL="postgresql://rowlab:rowlab_dev_password@localhost:5432/rowlab_dev"
```

**Step 4: Verify connection**

```bash
psql "postgresql://rowlab:rowlab_dev_password@localhost:5432/rowlab_dev" -c "SELECT 1;"
```

Expected: Returns `1`

**Step 5: Commit**

```bash
git add .env.example scripts/
git commit -m "chore: add PostgreSQL setup script and connection config"
```

---

### Task 2: Update Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Remove SQLite dependencies, add PostgreSQL**

```bash
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3
npm install pg @types/pg
npm install uuid @types/uuid
npm install crypto-js @types/crypto-js
```

**Step 2: Add new auth dependencies**

```bash
npm install cookie-parser @types/cookie-parser
npm install express-rate-limit
```

**Step 3: Verify installation**

```bash
npm ls pg uuid cookie-parser
```

Expected: Shows installed versions

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies for PostgreSQL and enhanced auth"
```

---

## Phase 1B: Database Schema

### Task 3: Create New Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Backup current schema**

```bash
cp prisma/schema.prisma prisma/schema.prisma.bak
```

**Step 2: Write new schema**

Replace `prisma/schema.prisma` with:

```prisma
// Prisma schema for RowLab v2.0
// PostgreSQL with multi-tenant team isolation

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE: Users, Teams, Membership
// ============================================

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  status        String   @default("active") // active, suspended
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  memberships   TeamMember[]
  refreshTokens RefreshToken[]
  announcements Announcement[]

  @@map("users")
}

model Team {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique
  inviteCode        String?  @unique
  isPublic          Boolean  @default(false)
  visibilitySetting String   @default("coaches_only") // open, coaches_only, opt_in
  settings          Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  members       TeamMember[]
  athletes      Athlete[]
  invitations   Invitation[]
  lineups       Lineup[]
  ergTests      ErgTest[]
  workouts      Workout[]
  announcements Announcement[]
  shells        Shell[]
  boatConfigs   BoatConfig[]

  @@map("teams")
}

model TeamMember {
  id        String   @id @default(uuid())
  userId    String
  teamId    String
  role      String   // OWNER, COACH, ATHLETE
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
  @@map("team_members")
}

// ============================================
// AUTH: Tokens, Invitations
// ============================================

model RefreshToken {
  id          String   @id @default(uuid())
  userId      String
  tokenHash   String   @unique
  familyId    String   // For rotation detection
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
  @@map("refresh_tokens")
}

model Invitation {
  id        String   @id @default(uuid())
  teamId    String
  athleteId String?  // For claim flow
  email     String
  tokenHash String   @unique // SHA-256 of actual token
  expiresAt DateTime
  status    String   @default("pending") // pending, claimed, expired, revoked
  createdAt DateTime @default(now())

  team    Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  athlete Athlete? @relation(fields: [athleteId], references: [id])

  @@index([tokenHash])
  @@map("invitations")
}

// ============================================
// ATHLETES: Profiles (managed or linked)
// ============================================

model Athlete {
  id              String   @id @default(uuid())
  teamId          String
  userId          String?  // NULL = managed by coach
  firstName       String
  lastName        String
  email           String?  // For invites
  side            String?  // Port, Starboard, Both, Cox
  isManaged       Boolean  @default(true)
  concept2UserId  String?
  weightKg        Decimal? @db.Decimal(5, 2)
  heightCm        Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  team            Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  ergTests        ErgTest[]
  workouts        Workout[]
  assignments     LineupAssignment[]
  invitations     Invitation[]
  concept2Auth    Concept2Auth?
  athleteRatings  AthleteRating[]
  telemetryData   AthleteTelemetry[]

  @@unique([teamId, lastName, firstName])
  @@index([teamId])
  @@map("athletes")
}

model Concept2Auth {
  athleteId      String   @id
  c2UserId       String
  accessToken    String
  refreshToken   String
  tokenExpiresAt DateTime
  lastSyncedAt   DateTime?

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@map("concept2_auth")
}

// ============================================
// ERG DATA: Tests and Workouts
// ============================================

model ErgTest {
  id           String   @id @default(uuid())
  athleteId    String
  teamId       String
  testType     String   // 2k, 6k, 30min, 500m
  testDate     DateTime
  distanceM    Int?
  timeSeconds  Decimal  @db.Decimal(10, 1)
  splitSeconds Decimal? @db.Decimal(6, 1)
  watts        Int?
  strokeRate   Int?
  weightKg     Decimal? @db.Decimal(5, 2) // Weight at time of test
  notes        String?
  createdAt    DateTime @default(now())

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  team    Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([athleteId])
  @@map("erg_tests")
}

model Workout {
  id             String   @id @default(uuid())
  athleteId      String
  teamId         String
  source         String   // manual, concept2_sync, csv_import, bluetooth
  c2LogbookId    String?  @unique
  date           DateTime
  distanceM      Int?
  durationSeconds Decimal? @db.Decimal(10, 1)
  strokeRate     Int?
  calories       Int?
  dragFactor     Int?
  deviceInfo     Json?
  rawData        Json?
  createdAt      DateTime @default(now())

  athlete   Athlete           @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  team      Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  telemetry WorkoutTelemetry?

  @@index([teamId])
  @@index([athleteId])
  @@map("workouts")
}

model WorkoutTelemetry {
  workoutId        String    @id
  timeSeriesS      Decimal[] @db.Decimal(10, 1)
  wattsSeries      Int[]
  heartRateSeries  Int[]
  strokeRateSeries Int[]
  forceCurves      Json?

  workout Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

  @@map("workout_telemetry")
}

// ============================================
// LINEUPS: Boat assignments
// ============================================

model Lineup {
  id        String   @id @default(uuid())
  teamId    String
  name      String
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team        Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  assignments LineupAssignment[]

  @@index([teamId])
  @@map("lineups")
}

model LineupAssignment {
  id         String  @id @default(uuid())
  lineupId   String
  athleteId  String
  boatClass  String
  shellName  String?
  seatNumber Int
  side       String  // Port, Starboard
  isCoxswain Boolean @default(false)

  lineup  Lineup  @relation(fields: [lineupId], references: [id], onDelete: Cascade)
  athlete Athlete @relation(fields: [athleteId], references: [id])

  @@map("lineup_assignments")
}

model Shell {
  id        String  @id @default(uuid())
  teamId    String
  name      String
  boatClass String
  notes     String?

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, name])
  @@map("shells")
}

model BoatConfig {
  id          String  @id @default(uuid())
  teamId      String
  name        String  // e.g., "Varsity 8+"
  numSeats    Int
  hasCoxswain Boolean

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, name])
  @@map("boat_configs")
}

// ============================================
// COMMUNICATION: Announcements
// ============================================

model Announcement {
  id        String   @id @default(uuid())
  teamId    String
  authorId  String
  title     String
  content   String
  priority  String   @default("normal") // normal, important, urgent
  visibleTo String   @default("all")    // all, athletes, coaches
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team   Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  author User               @relation(fields: [authorId], references: [id])
  reads  AnnouncementRead[]

  @@index([teamId])
  @@map("announcements")
}

model AnnouncementRead {
  announcementId String
  userId         String
  readAt         DateTime @default(now())

  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)

  @@id([announcementId, userId])
  @@map("announcement_reads")
}

// ============================================
// SEAT RACING: Selection system
// ============================================

model AthleteRating {
  id              String   @id @default(uuid())
  athleteId       String
  teamId          String
  ratingType      String   // seat_race_elo, combined
  ratingValue     Decimal  @default(1000) @db.Decimal(8, 2)
  confidenceScore Decimal? @db.Decimal(4, 3)
  racesCounted    Int      @default(0)
  lastCalculatedAt DateTime @default(now())

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@unique([athleteId, ratingType])
  @@map("athlete_ratings")
}

// ============================================
// TELEMETRY: Oarlock/sensor data
// ============================================

model AthleteTelemetry {
  id             String   @id @default(uuid())
  athleteId      String
  sessionDate    DateTime
  source         String   // empower, peach, nk
  seatNumber     Int?
  avgWatts       Decimal? @db.Decimal(6, 2)
  peakWatts      Decimal? @db.Decimal(6, 2)
  workPerStroke  Decimal? @db.Decimal(8, 2)
  slipDegrees    Decimal? @db.Decimal(5, 2)
  washDegrees    Decimal? @db.Decimal(5, 2)
  catchAngle     Decimal? @db.Decimal(5, 2)
  finishAngle    Decimal? @db.Decimal(5, 2)
  peakForceAngle Decimal? @db.Decimal(5, 2)
  techScore      Decimal? @db.Decimal(5, 2)
  createdAt      DateTime @default(now())

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@index([athleteId])
  @@map("athlete_telemetry")
}
```

**Step 3: Validate schema syntax**

```bash
npx prisma validate
```

Expected: "The schema file is valid!"

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/schema.prisma.bak
git commit -m "feat: add new PostgreSQL schema for multi-tenant RowLab v2"
```

---

### Task 4: Run Database Migration

**Files:**
- Create: `prisma/migrations/` (auto-generated)

**Step 1: Generate and apply migration**

```bash
npx prisma migrate dev --name init_v2_schema
```

Expected: Migration created and applied successfully

**Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: "Prisma Client generated"

**Step 3: Verify tables exist**

```bash
psql "postgresql://rowlab:rowlab_dev_password@localhost:5432/rowlab_dev" -c "\dt"
```

Expected: Lists all tables (users, teams, team_members, athletes, etc.)

**Step 4: Commit**

```bash
git add prisma/migrations/
git commit -m "chore: add initial PostgreSQL migration"
```

---

## Phase 1C: Authentication Foundation

### Task 5: Create Auth Service

**Files:**
- Create: `server/services/authService.js`
- Create: `server/services/tokenService.js`

**Step 1: Create token service**

Create `server/services/tokenService.js`:

```javascript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/connection.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(user, activeTeamId, activeTeamRole) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      activeTeamId,
      activeTeamRole,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token and store in database
 */
export async function generateRefreshToken(userId, familyId = null) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const newFamilyId = familyId || crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      familyId: newFamilyId,
      expiresAt,
    },
  });

  return { token, familyId: newFamilyId };
}

/**
 * Verify and rotate refresh token
 */
export async function rotateRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    return { valid: false, error: 'Invalid token' };
  }

  // Check if token was revoked (reuse detection)
  if (storedToken.revokedAt) {
    // Revoke entire family - potential token theft
    await prisma.refreshToken.updateMany({
      where: { familyId: storedToken.familyId },
      data: { revokedAt: new Date() },
    });
    return { valid: false, error: 'Token reuse detected - all sessions revoked' };
  }

  // Check expiry
  if (new Date() > storedToken.expiresAt) {
    return { valid: false, error: 'Token expired' };
  }

  // Revoke current token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new token in same family
  const newToken = await generateRefreshToken(storedToken.userId, storedToken.familyId);

  return {
    valid: true,
    user: storedToken.user,
    newRefreshToken: newToken.token,
  };
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

**Step 2: Create auth service**

Create `server/services/authService.js`:

```javascript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { generateAccessToken, generateRefreshToken, revokeAllUserTokens } from './tokenService.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
export async function registerUser({ email, password, name }) {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Login user and generate tokens
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new Error('Account is suspended');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Get first team as default active team
  const firstMembership = user.memberships[0];
  const activeTeamId = firstMembership?.teamId || null;
  const activeTeamRole = firstMembership?.role || null;

  // Generate tokens
  const accessToken = generateAccessToken(user, activeTeamId, activeTeamRole);
  const { token: refreshToken } = await generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    teams: user.memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
    activeTeamId,
    accessToken,
    refreshToken,
  };
}

/**
 * Switch active team context
 */
export async function switchTeam(userId, newTeamId) {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId: newTeamId },
    },
    include: {
      user: true,
      team: true,
    },
  });

  if (!membership) {
    throw new Error('Not a member of this team');
  }

  const accessToken = generateAccessToken(
    membership.user,
    membership.teamId,
    membership.role
  );

  return {
    accessToken,
    team: {
      id: membership.team.id,
      name: membership.team.name,
      slug: membership.team.slug,
      role: membership.role,
    },
  };
}

/**
 * Get current user with teams
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    teams: user.memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
  };
}

/**
 * Logout user (revoke refresh token)
 */
export async function logoutUser(userId) {
  await revokeAllUserTokens(userId);
}

/**
 * Generate invite token hash
 */
export function hashInviteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random invite token
 */
export function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}
```

**Step 3: Create services directory index**

Create `server/services/index.js`:

```javascript
export * from './authService.js';
export * from './tokenService.js';
```

**Step 4: Commit**

```bash
git add server/services/
git commit -m "feat: add auth and token services with refresh rotation"
```

---

### Task 6: Create Auth Middleware

**Files:**
- Modify: `server/middleware/auth.js`

**Step 1: Update auth middleware**

Replace `server/middleware/auth.js`:

```javascript
import { verifyAccessToken } from '../services/tokenService.js';
import { prisma } from '../db/connection.js';

/**
 * Verify JWT and attach user to request
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authentication required' },
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    activeTeamId: payload.activeTeamId,
    activeTeamRole: payload.activeTeamRole,
  };

  next();
}

/**
 * Require specific roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user.activeTeamRole) {
      return res.status(403).json({
        success: false,
        error: { code: 'NO_TEAM', message: 'No active team selected' },
      });
    }

    if (!roles.includes(req.user.activeTeamRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

/**
 * Require active team context
 */
export function requireTeam(req, res, next) {
  if (!req.user.activeTeamId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_TEAM', message: 'No active team selected' },
    });
  }
  next();
}

/**
 * Team isolation middleware - ensures queries are scoped to active team
 */
export function teamIsolation(req, res, next) {
  if (!req.user?.activeTeamId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_TEAM', message: 'Team context required' },
    });
  }

  // Attach team filter helper
  req.teamFilter = { teamId: req.user.activeTeamId };
  next();
}
```

**Step 2: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: update auth middleware with role checks and team isolation"
```

---

### Task 7: Create Auth Routes

**Files:**
- Modify: `server/routes/auth.js`

**Step 1: Rewrite auth routes**

Replace `server/routes/auth.js`:

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  switchTeam,
  getCurrentUser,
  logoutUser,
} from '../services/authService.js';
import {
  rotateRefreshToken,
  generateAccessToken,
} from '../services/tokenService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
  },
});

// Validation helpers
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * POST /api/v1/auth/register
 * Create new user account
 */
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const user = await registerUser({ email, password, name });

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: error.message },
        });
      }
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Registration failed' },
      });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login and get tokens
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await loginUser({ email, password });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          teams: result.teams,
          activeTeamId: result.activeTeamId,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      }
      if (error.message === 'Account is suspended') {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_SUSPENDED', message: error.message },
        });
      }
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Login failed' },
      });
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token required' },
      });
    }

    const result = await rotateRefreshToken(refreshToken);
    if (!result.valid) {
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: result.error },
      });
    }

    // Get user's first team for new access token
    const user = result.user;
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
    });

    const accessToken = generateAccessToken(
      user,
      membership?.teamId || null,
      membership?.role || null
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', result.newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Token refresh failed' },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout and revoke tokens
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await logoutUser(req.user.id);
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Logout failed' },
    });
  }
});

/**
 * POST /api/v1/auth/switch-team
 * Switch active team context
 */
router.post(
  '/switch-team',
  authenticateToken,
  [body('teamId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { teamId } = req.body;
      const result = await switchTeam(req.user.id, teamId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_MEMBER', message: error.message },
        });
      }
      console.error('Switch team error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to switch team' },
      });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user and their teams
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get user' },
    });
  }
});

export default router;
```

**Step 2: Add missing import to routes**

Add at top of file after imports:
```javascript
import { prisma } from '../db/connection.js';
```

**Step 3: Commit**

```bash
git add server/routes/auth.js
git commit -m "feat: rewrite auth routes with register, login, refresh, switch-team"
```

---

### Task 8: Update Database Connection

**Files:**
- Modify: `server/db/connection.js`

**Step 1: Update to use Prisma client**

Replace `server/db/connection.js`:

```javascript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

**Step 2: Commit**

```bash
git add server/db/connection.js
git commit -m "chore: update db connection to use Prisma client"
```

---

### Task 9: Update Server Entry Point

**Files:**
- Modify: `server/index.js`

**Step 1: Update imports and add cookie-parser**

Add near top of `server/index.js` after existing imports:

```javascript
import cookieParser from 'cookie-parser';
```

Add after `app.use(express.json(...))`:

```javascript
app.use(cookieParser());
```

**Step 2: Update auth routes mounting**

Find the auth routes section and update the path:

```javascript
// Mount routes at /api/v1
app.use('/api/v1/auth', authRoutes);
```

**Step 3: Commit**

```bash
git add server/index.js
git commit -m "chore: add cookie-parser and update API route prefix"
```

---

## Phase 1D: Team Management

### Task 10: Create Team Service

**Files:**
- Create: `server/services/teamService.js`

**Step 1: Create team service**

Create `server/services/teamService.js`:

```javascript
import crypto from 'crypto';
import { prisma } from '../db/connection.js';

/**
 * Generate unique slug from team name
 */
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Generate invite code
 */
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new team
 */
export async function createTeam({ name, userId, isPublic = false }) {
  const slug = generateSlug(name);
  const inviteCode = generateInviteCode();

  const team = await prisma.team.create({
    data: {
      name,
      slug,
      inviteCode,
      isPublic,
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: true,
    },
  });

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    inviteCode: team.inviteCode,
    isPublic: team.isPublic,
    role: 'OWNER',
  };
}

/**
 * Get team by ID (with membership check)
 */
export async function getTeam(teamId, userId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId },
      },
      _count: {
        select: {
          athletes: true,
          members: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  if (team.members.length === 0) {
    throw new Error('Not a member of this team');
  }

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    inviteCode: team.members[0].role === 'OWNER' ? team.inviteCode : null,
    isPublic: team.isPublic,
    visibilitySetting: team.visibilitySetting,
    role: team.members[0].role,
    athleteCount: team._count.athletes,
    memberCount: team._count.members,
  };
}

/**
 * Update team settings
 */
export async function updateTeam(teamId, userId, updates) {
  // Verify ownership
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || membership.role !== 'OWNER') {
    throw new Error('Only team owner can update settings');
  }

  const allowedFields = ['name', 'isPublic', 'visibilitySetting'];
  const data = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  return team;
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    email: m.user.email,
    name: m.user.name,
    role: m.role,
    joinedAt: m.createdAt,
  }));
}

/**
 * Join team via invite code
 */
export async function joinTeamByCode(code, userId) {
  const team = await prisma.team.findUnique({
    where: { inviteCode: code },
  });

  if (!team) {
    throw new Error('Invalid invite code');
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
  });

  if (existing) {
    throw new Error('Already a member of this team');
  }

  await prisma.teamMember.create({
    data: {
      userId,
      teamId: team.id,
      role: 'ATHLETE', // Default role for code joins
    },
  });

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    role: 'ATHLETE',
  };
}

/**
 * Search public teams
 */
export async function searchTeams(query) {
  const teams = await prisma.team.findMany({
    where: {
      isPublic: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { members: true },
      },
    },
    take: 20,
  });

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    memberCount: t._count.members,
  }));
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(teamId, userId) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership || !['OWNER', 'COACH'].includes(membership.role)) {
    throw new Error('Insufficient permissions');
  }

  const newCode = generateInviteCode();
  await prisma.team.update({
    where: { id: teamId },
    data: { inviteCode: newCode },
  });

  return newCode;
}
```

**Step 2: Update services index**

Add to `server/services/index.js`:

```javascript
export * from './teamService.js';
```

**Step 3: Commit**

```bash
git add server/services/teamService.js server/services/index.js
git commit -m "feat: add team service with create, join, search functionality"
```

---

### Task 11: Create Team Routes

**Files:**
- Create: `server/routes/teams.js`

**Step 1: Create team routes**

Create `server/routes/teams.js`:

```javascript
import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createTeam,
  getTeam,
  updateTeam,
  getTeamMembers,
  joinTeamByCode,
  searchTeams,
  regenerateInviteCode,
} from '../services/teamService.js';
import { authenticateToken, requireRole, requireTeam } from '../middleware/auth.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * POST /api/v1/teams
 * Create a new team
 */
router.post(
  '/',
  authenticateToken,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('isPublic').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, isPublic } = req.body;
      const team = await createTeam({ name, userId: req.user.id, isPublic });

      res.status(201).json({
        success: true,
        data: { team },
      });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/search
 * Search public teams
 */
router.get(
  '/search',
  authenticateToken,
  [query('q').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const teams = await searchTeams(req.query.q);
      res.json({
        success: true,
        data: { teams },
      });
    } catch (error) {
      console.error('Search teams error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Search failed' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id
 * Get team details
 */
router.get(
  '/:id',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const team = await getTeam(req.params.id, req.user.id);
      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      console.error('Get team error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get team' },
      });
    }
  }
);

/**
 * PATCH /api/v1/teams/:id
 * Update team settings
 */
router.patch(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('isPublic').optional().isBoolean(),
    body('visibilitySetting').optional().isIn(['open', 'coaches_only', 'opt_in']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const team = await updateTeam(req.params.id, req.user.id, req.body);
      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      if (error.message === 'Only team owner can update settings') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      console.error('Update team error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/members
 * Get team members
 */
router.get(
  '/:id/members',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // First verify membership
      await getTeam(req.params.id, req.user.id);
      const members = await getTeamMembers(req.params.id);

      res.json({
        success: true,
        data: { members },
      });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get members' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/join/:code
 * Join team via invite code
 */
router.post(
  '/join/:code',
  authenticateToken,
  [param('code').isLength({ min: 8, max: 8 })],
  validateRequest,
  async (req, res) => {
    try {
      const team = await joinTeamByCode(req.params.code, req.user.id);
      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      if (error.message === 'Invalid invite code') {
        return res.status(404).json({
          success: false,
          error: { code: 'INVALID_CODE', message: error.message },
        });
      }
      if (error.message === 'Already a member of this team') {
        return res.status(409).json({
          success: false,
          error: { code: 'ALREADY_MEMBER', message: error.message },
        });
      }
      console.error('Join team error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to join team' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/:id/regenerate-code
 * Regenerate invite code
 */
router.post(
  '/:id/regenerate-code',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const newCode = await regenerateInviteCode(req.params.id, req.user.id);
      res.json({
        success: true,
        data: { inviteCode: newCode },
      });
    } catch (error) {
      if (error.message === 'Insufficient permissions') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      console.error('Regenerate code error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to regenerate code' },
      });
    }
  }
);

export default router;
```

**Step 2: Register routes in server/index.js**

Add import:
```javascript
import teamRoutes from './routes/teams.js';
```

Add route mounting:
```javascript
app.use('/api/v1/teams', teamRoutes);
```

**Step 3: Commit**

```bash
git add server/routes/teams.js server/index.js
git commit -m "feat: add team routes with CRUD and invite code join"
```

---

## Phase 1E-1H: Remaining Backend & Frontend

Due to the extensive nature of this plan, the remaining phases are outlined below. Each should follow the same TDD pattern.

### Task 12-15: Athlete Service & Routes (Phase 1E)
- Create `server/services/athleteService.js`
- Create `server/routes/athletes.js`
- CRUD operations for athletes
- Invite/claim flow for linking accounts

### Task 16-20: Invite System (Phase 1E continued)
- Create `server/services/inviteService.js`
- Create `server/routes/invites.js`
- Generate, send, and claim invitations
- Email integration placeholder

### Task 21-30: Frontend Design System (Phase 1G)
- Update `tailwind.config.js` with new color palette
- Create `src/styles/design-tokens.css`
- Update base styles in `src/App.css`
- Create component library:
  - `src/components/ui/Button.jsx`
  - `src/components/ui/Card.jsx`
  - `src/components/ui/Input.jsx`
  - `src/components/ui/Badge.jsx`

### Task 31-40: Auth UI (Phase 1H)
- Create `src/pages/auth/LoginPage.jsx`
- Create `src/pages/auth/RegisterPage.jsx`
- Create `src/pages/auth/InviteClaimPage.jsx`
- Update `src/store/authStore.js` for new JWT flow
- Create `src/hooks/useAuth.js`

---

## Execution Checklist

- [ ] Task 1: PostgreSQL setup
- [ ] Task 2: Update dependencies
- [ ] Task 3: New Prisma schema
- [ ] Task 4: Run migration
- [ ] Task 5: Auth service
- [ ] Task 6: Auth middleware
- [ ] Task 7: Auth routes
- [ ] Task 8: DB connection
- [ ] Task 9: Server entry point
- [ ] Task 10: Team service
- [ ] Task 11: Team routes
- [ ] Task 12-15: Athlete backend
- [ ] Task 16-20: Invite system
- [ ] Task 21-30: Design system
- [ ] Task 31-40: Auth UI

---

## Testing Strategy

After each major component:

```bash
# Run existing tests
npm run test:run

# Manual API testing with curl
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## Notes

- Keep old SQLite data as backup during migration
- Test refresh token rotation carefully
- Verify team isolation with multiple test users
- Design system should be implemented before new pages
