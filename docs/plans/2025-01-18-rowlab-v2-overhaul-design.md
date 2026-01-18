# RowLab v2.0 Complete Overhaul Design

**Date:** 2025-01-18
**Status:** Approved
**Author:** Design Session with Claude

---

## Executive Summary

This document outlines a comprehensive redesign of RowLab from a single-team lineup manager into a full-featured, multi-tenant rowing team management SaaS platform. The overhaul includes:

- **Dual account system** (coaches and athletes with flexible profiles)
- **Team management** with invite codes and public directory
- **Concept2 Logbook integration** via OAuth
- **Seat racing system** with statistical analysis
- **Race results tracking** with CMAX-style rankings
- **Modern dark UI** inspired by Linear, Whoop, and Strava
- **Modular AI framework** for future enhancements
- **Telemetry integration** (Empower, Peach, NK)
- **Future iOS app** with PM5 Bluetooth support

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Model](#2-data-model)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Concept2 Integration](#4-concept2-integration)
5. [AI Framework](#5-ai-framework)
6. [Seat Racing System](#6-seat-racing-system)
7. [Team Communication](#7-team-communication)
8. [Frontend Design System](#8-frontend-design-system)
9. [API Structure](#9-api-structure)
10. [Implementation Phases](#10-implementation-phases)
11. [Future Expansion](#11-future-expansion)

---

## 1. System Architecture

### Core Architecture: API-First Multi-Tenant Platform

RowLab will be rebuilt as an API-first platform with clear separation between backend services and frontend clients.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTS                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Web App    │  │   iOS App    │  │  Self-Hosted │       │
│  │   (React)    │  │   (Future)   │  │   Instances  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    REST API (Express)                        │
│  • JWT Authentication    • Team Isolation Middleware         │
│  • Rate Limiting         • API Versioning (/api/v1)         │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │  Auth   │ │  Team   │ │ Workout │ │    AI Service   │   │
│  │ Service │ │ Service │ │ Service │ │ (Pluggable LLM) │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Multi-Tenant)                       │
│         All tables include teamId for isolation              │
│         Row Level Security (RLS) enforced                    │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Model

- **Central SaaS** (hosted by RowLab) - Teams create accounts, data stored centrally
- **Self-Hosted Option** - Teams can run their own instance with auth token
- **Future Monetization** - Reduced fees for self-hosted, premium for central hosting

### Key Principles

- Every API endpoint is stateless and documented
- Team isolation enforced at middleware level (not just queries)
- Service layer abstracts business logic from routes
- AI service uses adapter pattern for easy model swapping

---

## 2. Data Model

### Core Entities

```
┌─────────┐      ┌─────────────┐      ┌─────────┐
│  User   │◄────►│ TeamMember  │◄────►│  Team   │
└─────────┘      └─────────────┘      └─────────┘
                        │                   │
              ┌─────────┘                   │
              ▼                             ▼
        ┌──────────┐                 ┌───────────┐
        │ Athlete  │◄────────────────│ Invitation│
        └──────────┘                 └───────────┘
              │
    ┌─────────┼─────────┬──────────────┐
    ▼         ▼         ▼              ▼
┌────────┐ ┌───────┐ ┌──────────┐ ┌────────────┐
│Workout │ │ErgTest│ │Biometrics│ │Concept2Auth│
└────────┘ └───────┘ └──────────┘ └────────────┘
    │
    ▼
┌───────────────┐
│WorkoutTelemetry│
└───────────────┘
```

### Team & User Tables

```sql
-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  invite_code VARCHAR(20) UNIQUE,
  is_public BOOLEAN DEFAULT false,
  visibility_setting VARCHAR(20) DEFAULT 'coaches_only', -- open, coaches_only, opt_in
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (account holders)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership (supports multi-team)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  role VARCHAR(20) NOT NULL, -- OWNER, COACH, ATHLETE
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- Athletes (can be managed or linked to user)
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  user_id UUID REFERENCES users(id), -- NULL = managed by coach
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255), -- For invites
  side VARCHAR(10), -- Port, Starboard, Both, Cox
  is_managed BOOLEAN DEFAULT true, -- Coach-only profile
  concept2_user_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  athlete_id UUID REFERENCES athletes(id), -- For claim flow
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL, -- SHA-256 of token
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, claimed, expired
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workout & Erg Tables

```sql
-- Workouts (from C2, manual, CSV, Bluetooth)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  source VARCHAR(20) NOT NULL, -- manual, concept2_sync, csv_import, bluetooth
  c2_logbook_id VARCHAR(50) UNIQUE, -- Prevent duplicate syncs
  date DATE NOT NULL,
  distance_meters INT,
  duration_seconds NUMERIC(10,1),
  stroke_rate INT,
  calories INT,
  drag_factor INT,
  device_info JSONB,
  raw_data JSONB, -- Full API response
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout telemetry (high-frequency Bluetooth data)
CREATE TABLE workout_telemetry (
  workout_id UUID PRIMARY KEY REFERENCES workouts(id),
  time_series_seconds NUMERIC[],
  watts_series INT[],
  heart_rate_series INT[],
  stroke_rate_series INT[],
  force_curves JSONB
);

-- Erg tests (formal test pieces)
CREATE TABLE erg_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  test_type VARCHAR(20) NOT NULL, -- 2k, 6k, 30min, 500m
  test_date DATE NOT NULL,
  distance_meters INT,
  time_seconds NUMERIC(10,1),
  split_seconds NUMERIC(6,1), -- Per 500m
  watts INT,
  stroke_rate INT,
  weight_kg NUMERIC(5,2), -- For power-to-weight
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concept2 OAuth tokens
CREATE TABLE concept2_auth (
  athlete_id UUID PRIMARY KEY REFERENCES athletes(id),
  c2_user_id VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  last_synced_at TIMESTAMPTZ
);
```

### Seat Racing Tables

```sql
-- Seat race sessions
CREATE TABLE seat_race_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  date DATE NOT NULL,
  location VARCHAR(100),
  conditions VARCHAR(20), -- calm, variable, rough
  boat_class VARCHAR(20), -- 8+, 4+, 4-, 2-
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pieces within a session
CREATE TABLE seat_race_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES seat_race_sessions(id),
  sequence_order INT NOT NULL,
  distance_meters INT,
  direction VARCHAR(20), -- upstream, downstream
  notes TEXT
);

-- Boats in a piece
CREATE TABLE seat_race_boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES seat_race_pieces(id),
  name VARCHAR(50), -- "Boat A", "Boat B"
  shell_name VARCHAR(50),
  finish_time_seconds NUMERIC(10,2),
  handicap_seconds NUMERIC(5,2) DEFAULT 0
);

-- Athlete assignments to boats
CREATE TABLE seat_race_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL REFERENCES seat_race_boats(id),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  seat_number INT NOT NULL, -- 1=Bow, 8=Stroke, 9=Cox
  side VARCHAR(10) -- Port, Starboard, Cox
);

-- Calculated athlete ratings
CREATE TABLE athlete_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  rating_type VARCHAR(20) NOT NULL, -- seat_race_elo, combined
  rating_value NUMERIC(8,2) DEFAULT 1000,
  confidence_score NUMERIC(4,3), -- 0.000 to 1.000
  races_counted INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Race Results Tables

```sql
-- Regattas
CREATE TABLE regattas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  date DATE NOT NULL,
  course_type VARCHAR(20), -- 2000m, 1500m, head
  conditions JSONB, -- wind, temp, current
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Races within regattas
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id),
  event_name VARCHAR(100) NOT NULL,
  boat_class VARCHAR(20) NOT NULL,
  distance_meters INT,
  is_head_race BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMPTZ
);

-- Race results
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES races(id),
  team_name VARCHAR(100) NOT NULL,
  is_own_team BOOLEAN DEFAULT false,
  lineup_id UUID REFERENCES lineups(id), -- If our team
  finish_time_seconds NUMERIC(10,2),
  place INT,
  margin_back_seconds NUMERIC(8,2),
  raw_speed NUMERIC(6,4), -- m/s
  adjusted_speed NUMERIC(6,4) -- Normalized
);

-- External teams for comparison
CREATE TABLE external_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  conference VARCHAR(50),
  division VARCHAR(20), -- D1, D2, D3, Club
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team speed estimates (CMAX-style)
CREATE TABLE team_speed_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  boat_class VARCHAR(20) NOT NULL,
  season VARCHAR(20), -- "Spring 2025"
  raw_speed NUMERIC(6,4),
  adjusted_speed NUMERIC(6,4),
  confidence_score NUMERIC(4,3),
  sample_count INT,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Communication Tables

```sql
-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  author_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- normal, important, urgent
  visible_to VARCHAR(20) DEFAULT 'all', -- all, athletes, coaches
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Read tracking
CREATE TABLE announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id),
  user_id UUID NOT NULL REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);
```

### Telemetry Tables

```sql
-- Oarlock/sensor data imports
CREATE TABLE telemetry_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  date DATE NOT NULL,
  source VARCHAR(20) NOT NULL, -- empower, peach, nk
  file_name VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-athlete telemetry metrics
CREATE TABLE athlete_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES telemetry_sessions(id),
  athlete_id UUID NOT NULL REFERENCES athletes(id),
  seat_number INT,
  avg_watts NUMERIC(6,2),
  peak_watts NUMERIC(6,2),
  work_per_stroke NUMERIC(8,2), -- Joules
  slip_degrees NUMERIC(5,2),
  wash_degrees NUMERIC(5,2),
  catch_angle NUMERIC(5,2),
  finish_angle NUMERIC(5,2),
  peak_force_angle NUMERIC(5,2),
  tech_score NUMERIC(5,2) -- 100 - (slip + wash)
);
```

---

## 3. Authentication & Authorization

### User Roles

```
PLATFORM_ADMIN  (manages all teams, billing)
       │
       ▼
TEAM_OWNER      (created the team, full control)
       │
       ▼
COACH           (manage athletes, lineups, data)
       │
       ▼
ATHLETE         (view own data, update own profile)
```

### Permission Matrix

| Action | Owner | Coach | Athlete |
|--------|-------|-------|---------|
| Manage team settings | ✓ | - | - |
| Invite/remove members | ✓ | ✓ | - |
| Create/edit athletes | ✓ | ✓ | - |
| Enter erg data (any) | ✓ | ✓ | - |
| Enter erg data (self) | ✓ | ✓ | ✓ |
| Create lineups | ✓ | ✓ | - |
| View lineups | ✓ | ✓ | ✓* |
| Post announcements | ✓ | ✓ | - |
| View announcements | ✓ | ✓ | ✓ |
| Enter race results | ✓ | ✓ | - |
| Link Concept2 (self) | ✓ | ✓ | ✓ |
| View team analytics | ✓ | ✓ | ✓* |

*Athlete access configurable by coach per team

### JWT Token Structure

```json
{
  "sub": "user_uuid",
  "activeTeamId": "team_uuid",
  "activeTeamRole": "COACH",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- Access Token: 15 minutes
- Refresh Token: 7 days (rotated on each use)
- Team list fetched from `/auth/me`, not stored in JWT

### Authentication Flows

1. **Standard Signup** - Choose Coach/Athlete → Create or join team
2. **Invite Link** - Click link → Create account or login → Auto-join team
3. **Claim Managed Profile** - Coach creates athlete → Sends invite → User claims profile
4. **Concept2 OAuth** - Link external C2 account for workout sync

### Security Features

- Refresh token rotation with reuse detection
- Invite tokens bound to specific email
- Rate limiting (5 login attempts/min, exponential backoff)
- Row Level Security (RLS) at database level

---

## 4. Concept2 Integration

### OAuth Flow

```
User clicks "Connect Concept2"
         │
         ▼
Redirect to C2: https://log.concept2.com/oauth/authorize
         │
         ▼
User authorizes RowLab (scopes: user:read results:read)
         │
         ▼
Callback with auth code
         │
         ▼
Exchange for access_token + refresh_token
         │
         ▼
Store in concept2_auth table
         │
         ▼
Trigger initial workout sync
```

### Sync Architecture

- Background worker polls every 15-30 minutes per user
- Uses `from_date` filter for incremental sync
- Deduplicates by `c2_logbook_id`
- Max 3-5 concurrent API requests
- Exponential backoff on errors

### Handling Shared Ergs

**Problem:** Multiple athletes use team erg logged into one C2 account

**Solutions:**
1. "Unclaimed Workouts" queue - Athletes claim their own pieces
2. Encourage ErgData app - Personal phone connects to PM5 via Bluetooth

### Manual Import

- CSV/Excel file upload
- AI-assisted column mapping
- Preview + confirmation before import
- Source marked as `csv_import`

---

## 5. AI Framework

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI SERVICE MANAGER                        │
│  • Provider selection    • Caching    • Fallback logic      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │  Ollama   │   │  OpenAI   │   │ Anthropic │
       │ (Current) │   │ (Future)  │   │ (Future)  │
       └───────────┘   └───────────┘   └───────────┘
```

### Use Cases

| Use Case | Phase | Model Tier |
|----------|-------|------------|
| CSV column mapping | Now | Ollama (local) |
| Fuzzy name matching | Now | Ollama (local) |
| Data format parsing | Now | Ollama (local) |
| Lineup optimization | Future | GPT-4 / Claude |
| Race prediction | Future | GPT-4 / Claude |
| Natural language queries | Future | GPT-4 / Claude |

### Graceful Degradation

Primary → Secondary → Rule-based fallback → User notification

### Caching Strategy

- CSV mapping: indefinite (headers rarely change)
- Name matching: 24 hours
- Predictions: 1 hour

---

## 6. Seat Racing System

### How It Works

```
BASELINE (Piece 1):          AFTER SWAP (Piece 2):
Boat A wins by +2.0s         Boat A wins by +5.0s

Swing = 5.0 - 2.0 = 3.0 seconds
Rower X is ~1.5s faster than Rower Y (swing ÷ 2)
```

### Analysis Algorithms

1. **Margin Swing Formula**
   - Swing = Margin₂ - Margin₁
   - Performance_Diff = Swing ÷ 2

2. **Elo-Style Ranking**
   - Every rower starts at 1000
   - Updates based on expected vs actual margins
   - Handles transitive comparisons

3. **Confidence Score**
   - Based on pieces rowed, conditions, recency

### Auto-Plan Generator

**Inputs:**
- Athletes (N)
- Target boat class (8+, 4+, etc.)
- Available practice sessions
- Pieces per session

**Output:**
- Optimal schedule of who races whom
- Swap instructions between pieces
- Data entry placeholders

### Telemetry Integration

**Supported Systems:**
- Empower Oarlocks (watts, slip, wash, angles)
- Peach PowerLine (force curves, boat acceleration)
- NK SpeedCoach (GPS speed, stroke rate)

**Combined Athlete Score:**
```
Score = (Erg_Watts × 0.35) +
        (OnWater_Watts × 0.35) +
        (Tech_Score × 0.15) +
        (SeatRace_Elo × 0.15)
```

---

## 7. Team Communication

### Initial Scope: Announcements

**Features:**
- Priority levels (normal, important, urgent)
- Read tracking
- Pin to top
- Audience targeting (all, athletes, coaches)
- Markdown support

### Future Expansion

1. Email notifications (opt-in, digest/instant)
2. Push notifications (iOS app)
3. Direct messaging
4. Group chats per boat

---

## 8. Frontend Design System

### Design Philosophy

"Athletic Precision Meets Data Clarity"

**Mood:** Competitive, precise, powerful, focused
**Inspiration:** Linear, Whoop, Cursor, TrainingPeaks

### Color Palette

```
BACKGROUNDS
────────────────────────────────────────
bg-base        #0A0E17    Deep navy (main)
bg-surface     #141B2D    Card backgrounds
bg-elevated    #1E293B    Hover states, modals
bg-input       #0F172A    Form inputs

BORDERS
────────────────────────────────────────
border-subtle  #1E293B    Default
border-hover   #334155    Interactive

TEXT
────────────────────────────────────────
text-primary   #F8FAFC    Headings
text-secondary #94A3B8    Body text
text-muted     #64748B    Captions

ACCENTS (Dual System)
────────────────────────────────────────
accent-blue    #2563EB    Primary actions
accent-orange  #F97316    Performance metrics

SEMANTIC
────────────────────────────────────────
success        #10B981    Positive
warning        #F59E0B    Caution
error          #EF4444    Errors
info           #06B6D4    Data highlights

ROWING-SPECIFIC
────────────────────────────────────────
port           #EF4444    Port side (red)
starboard      #22C55E    Starboard (green)
coxswain       #A855F7    Coxswain
```

### Typography

```
Display/Headings: Space Grotesk (500, 600, 700)
Body/UI:          Inter (400, 500, 600)
Monospace:        JetBrains Mono (400, 500)
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        base: '#0A0E17',
        surface: '#141B2D',
        elevated: '#1E293B',
        'accent-blue': '#2563EB',
        'accent-orange': '#F97316',
        port: '#EF4444',
        starboard: '#22C55E',
        coxswain: '#A855F7',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    }
  }
}
```

---

## 9. API Structure

### Base Configuration

```
BASE URL: /api/v1
Authentication: Bearer JWT
Content-Type: application/json
```

### Endpoint Groups

| Group | Endpoints |
|-------|-----------|
| Auth | register, login, refresh, logout, forgot-password, switch-team |
| Teams | CRUD, search, join, members, invites |
| Athletes | CRUD, invite, link, claim |
| Workouts | CRUD, import, unclaimed, claim |
| Erg Tests | CRUD, leaderboard, compare |
| Concept2 | auth-url, callback, sync, disconnect |
| Lineups | CRUD, duplicate, export |
| Seat Races | CRUD, pieces, rankings, generate-plan |
| Races | regattas, races, results, rankings |
| Announcements | CRUD, read tracking |
| AI | parse-csv, match-names, lineup-suggest |
| Telemetry | import, athlete data, compare |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation
- PostgreSQL + Prisma migration
- User/Team/Athlete models with RLS
- JWT auth with refresh rotation
- Team invite system
- Basic dashboard shell

### Phase 2: Data Core
- Enhanced erg test model
- Manual entry + CSV import
- Concept2 OAuth integration
- Workout sync worker
- Athlete personal dashboard

### Phase 3: Lineups
- Drag-and-drop boat builder
- Shell/equipment management
- Save/load/export lineups

### Phase 4: Selection
- Seat racing data entry
- Margin calculation engine
- Elo ranking system
- Auto-plan generator
- Basic AI (Ollama)

### Phase 5: Racing
- Regatta/race entry
- Speed calculation
- CMAX-style rankings
- External team tracking

### Phase 6: Communication
- Announcements system
- Read tracking
- Attendance (bonus)

### Phase 7: Advanced
- Telemetry imports
- Combined scoring
- AI enhancements

### Phase 8: Scale
- Self-hosted Docker package
- iOS app (React Native/Swift)
- PM5 Bluetooth
- Subscription billing

---

## 11. Future Expansion

| Feature | Phase | Notes |
|---------|-------|-------|
| Email notifications | Post-6 | SMTP + preferences |
| Push notifications | Phase 8 | Firebase/APNs |
| Direct messaging | Post-6 | WebSocket infrastructure |
| Video analysis | Future | Frame-by-frame stroke |
| Wearable integration | Future | Garmin/Apple Watch |
| GPS boat tracking | Future | On-water routes |
| AI lineup optimizer | Phase 7 | Genetic algorithm |
| Race predictor | Phase 7 | Regression + confidence |
| Team billing | Phase 8 | Stripe subscriptions |

---

## Appendix: Technology Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis (caching, rate limiting)
- Bull (background jobs)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Zustand (state)
- React Query (server state)
- Recharts (visualization)

**Infrastructure:**
- Docker
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)

**Future (iOS):**
- React Native or Swift/SwiftUI
- CoreBluetooth (PM5 connection)
