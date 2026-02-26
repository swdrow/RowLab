# RowLab Changelog

All notable changes to RowLab are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [5.0.11] - 2026-02-26

### Added
- Phase 63: Background documentation agent system (doc-keeper-planning, doc-keeper-public) for automated post-session doc updates
- Phase 63: Session-log skill now spawns doc-keeper agents on session end
- Phase 63: CLAUDE.md wiring with doc-keeper spawn templates for planning and public docs tiers

### Changed
- Phase 63: Deprecated doc-updater agent in favor of two-tier doc-keeper system (Haiku for planning, Sonnet for public)
- Phase 63: Reconciled package.json version to 5.0.10 from mismatched state

## [5.0.10] - 2026-02-26

### Added
- Phase 63: Real data search in command palette (athletes, workouts, teams)
- Phase 63: Two-panel command palette with grouped results and preview pane
- Phase 62: Change password and account deletion flows
- Phase 62: Notification and privacy preferences wired to database
- Phase 61: ErrorBoundary and route-level error components
- Phase 61: Shared ErrorState component with retry support
- Phase 59: Corner brackets, diamond markers, and warm rules across key pages
- Phase 59: Fancy section headers on dashboard and profile

### Changed
- Phase 60: Standardized page transitions, respect prefers-reduced-motion
- Phase 58: Enforced font-family rules (Space Grotesk, Inter, Space Mono)
- Phase 57: Migrated GlassCard to void-surface design tokens
- Phase 57: Eliminated banned CSS patterns (bg-gray-*, gradient borders)
- Phase 56: Fixed 62 TypeScript errors, configured ESLint for src-v4/

### Fixed
- Phase 55: React hooks ordering violation
- Phase 55: Team API response shape mismatches
- Phase 55: Race conditions in concurrent API calls
- Phase 54: 2 CRITICAL and 4 HIGH security vulnerabilities

### Removed
- Phase 58: Replaced lucide-react with design-system-compliant icons
- Phase 60: Removed banned staggered and counter animations

### v4.0 (In Progress) - Canvas Design System

**Milestone:** v2.1 Feature Expansion

Major architectural redesign with React 19, TanStack Router, and Tailwind v4.

#### Added
- **Phase 48-49:** Personal profile and team experience
  - User profile pages with inline editing
  - Avatar and banner upload
  - Personal records tracking (multi-machine support)
  - Weekly training trends
  - Achievements tab with unlockable badges
  - Team onboarding and ID generation

- **Phase 47:** Workout management v2
  - User-scoped workout API (`/api/u/*`)
  - Workout feed with filtering
  - Calendar views (monthly, heatmap, timeline)
  - Workout detail pages with splits visualization
  - Auto-calculate pace/watts/distance
  - Slide-over workout creation panel

- **Phase 46:** Personal dashboard
  - Dashboard orchestrator with staggered animations
  - Quick stats grid (4 stat cards)
  - Recent workouts section
  - PR highlights grid
  - Team context section
  - Full-page empty states

- **Phase 45:** User-scoped routes
  - RFC 7807 error handling
  - `GET /api/u/stats` with streak calculation
  - `GET /api/u/workouts` feed endpoint
  - Nullable `Workout.teamId` for personal workouts

#### Changed
- Migration from React Router 6 to TanStack Router
- State management split: Zustand (client) + TanStack Query (server)
- Design system evolved to Canvas (warm copper, glass cards, chamfered panels)
- Frontend port: 3001 (was 3001), backend port: 8000 (unchanged)

---

## [v3.1.0] - 2025-01-22

### v3.1 (Achievement Unlocked)

**Milestone:** v2.0 Production Launch

#### Added

**Phase 17:** Design overhaul (7/8 plans)
- Precision Instrument design system
- Void + Neon color palette
- Glass-morphic cards
- Typography hierarchy (Space Grotesk, DM Sans, JetBrains Mono)
- Shadow system with physical depth
- Blade blue glow effects

**Phase 19:** Warm design system (5/6 plans)
- Warm copper accent palette
- Glass cards with gradient borders
- Chamfered (beveled) panel system
- Spring-based physics animations
- Skeleton loaders (no spinners)

**Equipment Management:**
- Shell inventory tracking
- Oar set management
- Equipment assignment logs
- Maintenance tracking

**Gamification System:**
- Personal records with machine-specific tracking
- Achievement system with unlockable badges
- Streak tracking (workout consistency)
- Team activity feed
- Challenge system for team competitions

**Season Management:**
- Season creation and management
- Historical season archiving
- Season-specific statistics
- Cross-season comparisons

#### Enhanced
- Lineup builder with drag-and-drop improvements
- Seat racing ELO calculations
- Training plan compliance tracking
- Dashboard customization options

#### Fixed
- OAuth callback handling for Concept2/Strava
- Real-time collaboration presence indicators
- Mobile responsiveness issues
- Erg test leaderboard sorting

---

## [v3.0.0] - 2025-01-15

### v3.0 (Feature Complete)

**Milestone:** v1.1 Feature Expansion

First major stable release with comprehensive feature set.

#### Added

**Training Plans (Phase 6):**
- Create and manage periodized training plans
- Scheduled workouts with target paces
- Athlete assignment system
- Workout completion tracking
- Compliance scoring (actual vs target)
- Plan templates for quick creation

**Calendar System:**
- Team calendar with event management
- Event types: erg-test, water, lift, rest, meeting, regatta
- Visibility controls (all, coaches-only)
- Integration with training plans

**Water Sessions:**
- On-water session recording by coxswains
- Boat session tracking
- Piece-by-piece interval recording
- Conditions and notes

**Recruitment Tools:**
- Recruit visit tracking
- Visit scheduling and notes
- Recruit profile management

**Availability and Attendance:**
- Athlete availability tracking
- Session attendance recording
- Attendance overrides by coaches

**Whiteboard Collaboration:**
- Digital whiteboard for coaches
- Real-time collaborative editing
- Session planning tools

**Notifications:**
- In-app notification system
- Announcement notifications
- Training plan updates
- Event reminders

**Enhanced Features:**
- Rigging profiles for boats
- Lineup templates
- Equipment assignment tracking
- Dashboard preferences
- Share cards for social media

#### Changed
- Database schema expanded to 66 models
- API endpoints organized by domain
- Improved multi-tenant isolation
- Enhanced security middleware

#### Fixed
- Token refresh race conditions
- CSV import edge cases
- Concept2 webhook validation
- Strava activity deduplication

---

## [v2.0.0] - 2024-12-20

### v2.0 (The Foundation)

**Milestone:** v1.0 Core Product

Initial production-ready release.

#### Added

**Core Features:**
- User authentication (JWT + refresh tokens)
- Multi-tenant team management
- Team invitations and role-based access control
- Athlete profile management (managed vs linked)
- Erg test tracking (2k, 6k, 30min, 500m)
- Workout recording and history

**Lineup Builder:**
- Drag-and-drop boat lineup creation
- Seat assignment with side validation
- Multiple boat configurations
- Shell management
- Lineup history and versioning

**Seat Racing:**
- Seat racing session management
- Piece-by-piece recording
- ELO rating calculations
- Confidence scoring
- Race result analysis

**Regatta Management:**
- Regatta and race tracking
- Race results recording
- Speed calculations (raw and adjusted)
- Team speed estimates
- Inter-team rankings

**Integrations:**
- Concept2 OAuth integration
  - Automatic workout sync via webhooks
  - Manual sync on-demand
  - Token encryption (AES-256-GCM)
- Strava OAuth integration
  - Activity import (rowing workouts)
  - Concept2 to Strava upload
  - Activity type filtering

**Communication:**
- Team announcements
- Priority levels (normal, important, urgent)
- Read receipts
- Pin/unpin announcements
- Visibility controls

**AI Features:**
- AI lineup optimization (Ollama integration)
- Athlete performance analysis
- Lineup suggestions with reasoning

**Analytics:**
- Combined scoring system
- Athlete rankings (ELO, combined, Bradley-Terry)
- Team speed estimates
- Performance trends

#### Technical
- Express.js backend with PostgreSQL
- Prisma ORM for type-safe database access
- React 18 frontend with Zustand state management
- Socket.IO for real-time collaboration
- Winston logging
- Helmet.js security
- Rate limiting by endpoint category

---

## [v1.0.0] - 2024-11-15

### v1.0 (MVP)

**Milestone:** Initial Development

Minimum viable product for beta testing.

#### Added
- Basic user authentication
- Single-team support
- Athlete CRUD operations
- Simple lineup builder
- Erg test entry
- Basic regatta tracking

#### Known Limitations
- No multi-tenant support
- Limited OAuth integrations
- Manual data entry only
- No real-time features

---

## Version History by Milestone

### v2.2 (Planned - Q2 2026)

**Milestone:** v3.0 Intelligence Layer

Focus on advanced analytics and AI integration.

**Planned Features:**
- Telemetry integration (NK, Empower, Peach)
- Advanced AI lineup suggestions
- Predictive performance modeling
- Video analysis integration
- Enhanced coxswain tools

### v2.1 (Current - Q1 2026)

**Milestone:** v2.1 Feature Expansion

React 19 upgrade and Canvas design system.

**Focus Areas:**
- Modern React architecture (TanStack Router)
- Personal dashboard and profile
- User-scoped workout management
- Achievement and gamification system
- Team onboarding experience

### v2.0 (Completed - Q4 2025)

**Milestone:** v1.1 Feature Expansion

Training plans and recruitment tools.

**Completed:**
- Training plan system
- Calendar and scheduling
- Recruitment tracking
- Enhanced communication tools

### v1.0 (Completed - Q3 2025)

**Milestone:** v1.0 Core Product

Foundation and core features.

**Completed:**
- Multi-tenant architecture
- Lineup builder
- Seat racing
- Regatta management
- OAuth integrations

---

## Migration Guide

### Migrating from v3.0 to v4.0

**Breaking Changes:**
- Frontend routing changed from React Router to TanStack Router
- Workout API endpoints moved to `/api/u/*` for user-scoped access
- Design tokens migrated to Tailwind v4 format
- State management split between Zustand and TanStack Query

**Migration Steps:**

1. **Update dependencies:**
   ```bash
   npm install
   ```

2. **Database migration:**
   ```bash
   npx prisma migrate dev
   ```

3. **Update imports:**
   - Replace React Router imports with TanStack Router
   - Update Zustand store imports (no changes to API)
   - Update Tailwind class names for v4 compatibility

4. **API client changes:**
   - Add TanStack Query configuration
   - Update axios interceptors for new auth flow
   - Migrate to new query hook patterns

5. **Clear local storage:**
   - Old routing state no longer compatible
   - Auth tokens remain valid

**Deprecated (Still Supported):**
- Legacy React Router routes under `/legacy/*`
- Team-scoped workout API (`/api/v1/workouts`)
- V1 design system components

**Removed:**
- None (v4 maintains backward compatibility)

### Migrating from v2.0 to v3.0

**Breaking Changes:**
- None (v3.0 was additive)

**New Required Environment Variables:**
- None (all integrations remain optional)

**Database Changes:**
- Run migrations: `npx prisma migrate dev`
- Seed new achievements: `npm run db:seed`

---

## Deprecation Notices

### Deprecated in v4.0

**Will be removed in v5.0:**
- React Router 6 routes (use TanStack Router)
- Team-scoped workout endpoints (use `/api/u/*`)
- Legacy design system components
- Zustand for server state (use TanStack Query)

### Deprecated in v3.1

**Removed in v4.0:**
- None (v3.1 to v4.0 was non-breaking)

---

## Contributors

**Core Team:**
- swdrow - Lead Developer

**Special Thanks:**
- Rowing community for feature requests and testing
- Claude AI for architectural guidance
- Concept2 and Strava for integration support

---

## Release Schedule

**Major Releases:**
- v5.0: Q3 2026 (Microservices, Mobile App)
- v4.0: Q1 2026 (Current - Canvas Design)
- v3.0: Q4 2025 (Training Plans)
- v2.0: Q3 2025 (Multi-tenant Launch)
- v1.0: Q2 2025 (MVP)

**Minor Releases:**
- Bi-weekly feature updates
- Weekly bug fixes
- Daily commits to main branch

---

## Links

- **Repository:** https://github.com/swdrow/RowLab
- **Issues:** https://github.com/swdrow/RowLab/issues
- **Documentation:** /docs
- **Roadmap:** /.planning/ROADMAP.md

---

**Last Updated:** 2026-02-26
**Current Version:** v5.0.11
**Stable Version:** v5.0.11
