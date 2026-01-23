# RowLab UX Redesign

## What This Is

A ground-up rebuild of RowLab's frontend following a multi-persona Workspace/Context architecture, preserving all existing features while delivering a premium athletic design system. Uses the In-Place Strangler pattern to build at `/beta` route with `src/v2/` directory, sharing existing Zustand data stores but with completely new UI components.

## Core Value

Athletes and coaches get a context-aware dashboard experience that adapts to their role, showing relevant training data, team information, and actionable insights without navigation friction.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

**Architecture & Setup**
- [ ] V2 entry point at `/beta` route with CSS isolation via `.v2` class
- [ ] Design tokens system with dark/light/field modes
- [ ] Shared Zustand store integration between V1 and V2

**Shell & Navigation**
- [ ] ContextRail component for workspace switching (Me/Coach/Admin)
- [ ] WorkspaceSidebar with context-aware navigation
- [ ] ShellLayout as main application wrapper
- [ ] Theme persistence across sessions

**Personal Dashboard ("Me" Context)**
- [ ] Adaptive HeadlineWidget with heuristic-based type selection
- [ ] Concept2 integration with logbook data display
- [ ] Strava integration with activity feed
- [ ] Unified activity feed with source deduplication
- [ ] Dashboard preferences (pinned modules, hidden sources)

**Coach Features**
- [ ] Team Whiteboard with daily content and timeline
- [ ] Fleet Management (shells and oar sets)
- [ ] Athlete biometrics and availability tracking
- [ ] Team-wide availability calendar view

**Backend APIs**
- [ ] Fleet Management API (shells, oars CRUD)
- [ ] Availability API (athlete schedules, team view)
- [ ] Whiteboard API (daily posts, latest)
- [ ] Dashboard Preferences API
- [ ] Activity API with source deduplication

**Migration & Polish**
- [ ] All V1 features accessible via V2 shell
- [ ] Feature parity verification
- [ ] The Flip: V2 becomes default, V1 at `/legacy`

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile native app — Web-first, responsive design handles mobile use cases
- Real-time collaborative editing — Socket.IO exists but whiteboard is single-author
- Custom analytics dashboards — Use existing Concept2/Strava analytics
- Multi-team membership — Current architecture is one athlete per team
- Billing/subscription changes — Stripe integration unchanged

## Context

**Existing Codebase:**
- Full-stack monorepo: React 18 frontend (`src/`), Node.js backend (`server/`)
- PostgreSQL with Prisma ORM
- Zustand for state management (stores in `src/stores/`)
- Socket.IO for real-time collaboration
- External integrations: Concept2 Logbook, Strava, Stripe

**Migration Strategy:**
- In-Place Strangler: V1 untouched until V2 reaches feature parity
- V2 at `/beta` route during development
- Shared data stores prevent data duplication
- CSS isolation via `.v2` class scoping

**Design System:**
- Premium athletic aesthetic
- Three theme modes: dark (default), light, field (high-contrast outdoor)
- Framer Motion for micro-interactions
- Design tokens as CSS custom properties

## Constraints

- **Tech Stack**: React 18, TypeScript, Zustand, Tailwind CSS 3.4, Framer Motion, React Router v6, Vite 5 — Match existing stack
- **Architecture**: In-Place Strangler pattern — V1 must remain functional throughout
- **Testing**: TDD approach required — Tests before implementation
- **Compatibility**: Existing Prisma schema — New models extend, don't replace
- **API Versioning**: `/api/v1/` namespace — Maintain backward compatibility

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| In-Place Strangler over big-bang rewrite | Lower risk, V1 remains functional as fallback | — Pending |
| Shared Zustand stores between V1/V2 | Single source of truth for data, no duplication | — Pending |
| CSS isolation via `.v2` class | Prevents style conflicts during parallel operation | — Pending |
| Adaptive headline over fixed widget | Personalized experience based on user data | — Pending |
| Design tokens as CSS properties | Theme switching without JavaScript, SSR-friendly | — Pending |

---
*Last updated: 2026-01-23 after initial definition*
