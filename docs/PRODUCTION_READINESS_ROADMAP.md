# RowLab Production Readiness Roadmap

**Generated**: January 21, 2026
**Version**: 1.0
**Status**: Comprehensive Audit Complete

---

## Executive Summary

This document presents the complete findings from a comprehensive audit of the RowLab application, comparing the implementation plan against actual code, identifying security vulnerabilities, code quality issues, accessibility gaps, and providing a prioritized roadmap to production readiness.

### Audit Results Overview

| Category | Status | Issues Found | Priority |
|----------|--------|--------------|----------|
| **Feature Completeness** | 75-80% | Core features implemented | Continue |
| **Security** | Needs Work | 15 vulnerabilities (3 Critical) | P0 |
| **Design System Adherence** | 60% | 425 token violations | P1 |
| **Code Quality** | Needs Work | 87+ console.logs, large files | P1 |
| **Accessibility (WCAG)** | Needs Work | 47 violations | P1 |
| **Test Coverage** | ~5% | Need 565 more tests | P2 |
| **Architecture** | Good | Some refactoring needed | P2 |

---

## Part 1: Feature Implementation Status

### What's Working (75-80% Complete)

| Feature Area | Status | Implementation Quality |
|--------------|--------|------------------------|
| User Authentication | ✅ Complete | JWT + Refresh tokens, proper hashing |
| Multi-tenant Teams | ✅ Complete | Team isolation, roles (OWNER/COACH/ATHLETE) |
| Athlete Management | ✅ Complete | CRUD, bulk import, search/filter |
| Lineup Builder | ✅ Complete | Drag-drop, save/load, export |
| Erg Data Tracking | ✅ Complete | Manual entry, CSV import |
| Seat Racing | ✅ Complete | Margin calculations, ELO rankings |
| Concept2 Integration | ⚠️ 70% | OAuth done, sync pending |
| AI Lineup Optimizer | ✅ Complete | Genetic algorithm implementation |
| Dashboard | ✅ Complete | 4 presets, 13 widgets |
| Landing Page | ✅ Complete | Precision Instrument design |
| Billing/Stripe | ✅ Complete | Subscriptions, webhooks |
| Real-time Collaboration | ⚠️ 60% | WebSocket ready, UI pending |

### What's Missing

| Feature | Status | Effort |
|---------|--------|--------|
| Command Palette (Cmd+K) | Designed, not wired | 2-3 days |
| Mobile Bottom Dock | Component exists, not integrated | 1-2 days |
| Regatta Day Mode | Not started | 2 weeks |
| Weather Integration | Not started | 1 week |
| Training Plans | Not started | 3 weeks |
| Video Analysis | Not started | 4 weeks |

---

## Part 2: Security Audit Findings

### Critical Vulnerabilities (Fix Immediately)

#### SEC-001: AI Chat Endpoint Missing Authentication
- **File**: `server/routes/ai.js` line 257
- **OWASP**: A01:2021 Broken Access Control
- **Risk**: Unauthenticated users can consume AI resources
- **Fix**: Add `authenticateToken, teamIsolation` middleware

```javascript
// Current (VULNERABLE)
router.post('/chat', async (req, res) => {

// Fixed
router.post('/chat', authenticateToken, teamIsolation, async (req, res) => {
```

#### SEC-002: OAuth Tokens Stored Unencrypted
- **File**: `server/services/concept2Service.js` lines 175-176
- **OWASP**: A02:2021 Cryptographic Failures
- **Risk**: Database compromise exposes all Concept2 accounts
- **Fix**: Encrypt tokens with AES-256-GCM before storage

#### SEC-003: Concept2 Webhook Missing Signature Verification
- **File**: `server/routes/concept2.js` lines 269-287
- **OWASP**: A01:2021 Broken Access Control
- **Risk**: Attackers can forge webhook events
- **Fix**: Implement HMAC signature verification

### High Severity Issues

| ID | Issue | File | Fix |
|----|-------|------|-----|
| SEC-004 | OAuth state nonce not verified | concept2.js:71-166 | Store/verify state in Redis |
| SEC-005 | Password validation too weak | auth.js:54-56 | Use stronger validation schema |
| SEC-006 | Admin role check uses wrong property | index.js:209 | Use `req.user.isAdmin` |

### Medium Severity Issues

| ID | Issue | File | Fix |
|----|-------|------|-----|
| SEC-007 | CSP allows unsafe-inline | security.js:18-33 | Use nonces for scripts |
| SEC-008 | Rate limiting too permissive | security.js:52-53 | Reduce to 100 req/15min |
| SEC-009 | Missing CSRF protection | Various routes | Add CSRF tokens |

---

## Part 3: Design System Violations

### Design Token Migration Required

**Files with `gray-*` Tailwind classes (banned per design standard):**

Total: **425 violations across 38 files**

| File | Violations | Priority |
|------|------------|----------|
| AdminPanel.jsx | 70 | P1 |
| Boat3DPage.jsx | 26 | P2 |
| ShellManagementModal.jsx | 19 | P1 |
| RankingsDisplay.jsx | 19 | P1 |
| RegisterModal.jsx | 18 | P1 |
| AddErgTestModal.jsx | 17 | P1 |
| ErgDataTable.jsx | 15 | P1 |
| PDFExportModal.jsx | 15 | P2 |

### Required Replacements

```jsx
// BANNED → REQUIRED
bg-gray-900     → bg-void-deep or bg-[#08080a]
bg-gray-800     → bg-void-elevated
border-gray-700 → border-white/10
text-gray-400   → text-text-muted or text-[#A1A1AA]
text-gray-300   → text-text-secondary
```

### Animation Duration Violations

Files using `duration-300` (should be under 200ms per design standard):
- GlassCard.jsx (lines 66, 78)
- SpotlightBentoCard.jsx (lines 44, 52, 57, 64)
- Card.jsx (lines 41, 63, 84, 109)

---

## Part 4: Accessibility (WCAG 2.1 AA) Violations

### Critical WCAG Issues

| Criterion | Issue | Files | Impact |
|-----------|-------|-------|--------|
| 2.1.1 Keyboard | LineupBuilder no keyboard nav | LineupBoard.tsx | Complete barrier |
| 2.4.3 Focus Order | GlassModal missing focus trap | GlassModal.jsx | Users escape modal |
| 4.1.2 Name/Role | 35+ icon buttons missing aria-label | Multiple | Screen readers fail |
| 1.3.1 Labels | Form inputs not associated | LoginPage, RegisterPage | Screen readers can't identify |

### Detailed Fixes Required

#### Focus Trap for GlassModal
```jsx
// Add to GlassModal.jsx
useEffect(() => {
  if (!isOpen) return;
  const focusableElements = modalRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  // Trap focus within modal
  // Return focus on close
}, [isOpen]);
```

#### Keyboard Navigation for LineupBoard
```jsx
// Add to seat slots
<div
  role="button"
  tabIndex={0}
  aria-label={`Seat ${seatNumber}, ${athlete ? `occupied by ${athlete.name}` : 'empty'}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') assignAthlete(seatNumber);
  }}
>
```

#### Icon Buttons Need Labels
```jsx
// BEFORE (inaccessible)
<button onClick={onClose}><X size={16} /></button>

// AFTER (accessible)
<button onClick={onClose} aria-label="Close modal">
  <X size={16} aria-hidden="true" />
</button>
```

### Color Contrast Issues

| Color Pair | Current Ratio | Required | Fix |
|------------|---------------|----------|-----|
| text-muted on void-deep | ~3.2:1 | 4.5:1 | Increase opacity to 0.50 |
| text-tertiary on card | ~4.1:1 | 4.5:1 | Increase opacity to 0.65 |

---

## Part 5: Code Quality Issues

### Console Statements (87+)

**Frontend files with debug console.logs:**
- CommandPalette.tsx: lines 128, 137, 149, 161
- AILineupOptimizer.jsx: line 451
- LineupToolbar.jsx: line 231
- AppLayout.jsx: lines 151, 155
- useCollaboration.ts: lines 88, 91

**Server files using console instead of logger:**
60+ files use `console.error` instead of the existing Winston logger at `server/utils/logger.js`

### Large Files Needing Refactoring

| File | Lines | Recommendation |
|------|-------|----------------|
| RacingPage.jsx | 785 | Split into RaceSchedule, RaceResults, RaceForm, RaceList |
| AILineupOptimizer.jsx | 682 | Split into ConstraintsPanel, SuggestionsPanel, ProgressView |
| BillingPage.jsx | 693 | Split into PlanCards, UsageDisplay, CancelModal |
| LandingPage.jsx | 1766 | Extract sections into separate components |

### Routes Missing Input Validation

14 routes access `req.body` without validation:
- ai.js, aiLineup.js, regattas.js
- teamRankings.js, seatRaces.js, lineups.js
- ergData.js, health.js, settings.js
- subscriptions.js, telemetry.js
- externalTeams.js, combinedScoring.js, rankings.js

---

## Part 6: Test Coverage Plan

### Current State
- **Existing Tests**: ~100 (9 test files)
- **Coverage**: ~5%
- **Target**: 70%+ (665 tests)

### Tests Needed by Priority

| Priority | Category | Tests Needed |
|----------|----------|--------------|
| P1 | Auth middleware/services | 70 |
| P1 | Core stores (erg, shell, seatRace) | 45 |
| P2 | UI components | 140 |
| P2 | Backend routes | 130 |
| P3 | Hooks | 68 |
| P3 | E2E critical paths | 32 |

### Implementation Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1-2 | Auth middleware, tokenService, core services |
| Phase 2 | Week 3-4 | Frontend stores, test utilities |
| Phase 3 | Week 5-6 | UI components (Input, AthleteCard, etc.) |
| Phase 4 | Week 7-8 | Backend route integration tests |
| Phase 5 | Week 9-10 | Hooks and E2E tests |

---

## Part 7: Architecture Recommendations

### State Management Standardization

**Issue**: Inconsistent auth token retrieval across stores

| Store | Current Method | Recommendation |
|-------|----------------|----------------|
| regattaStore.js | `localStorage.getItem('accessToken')` | Use `useAuthStore.getState().accessToken` |
| subscriptionStore.js | `useAuthStore.getState().accessToken` | ✅ Correct |
| lineupStore.js | `authenticatedFetch` | ✅ Correct |

### Missing Barrel Exports

Directories needing `index.js`:
- `/src/components/SeatRacing/`
- `/src/components/AthleteBank/`
- `/src/components/BoatDisplay/`
- `/src/store/`

### TypeScript Migration Priority

Currently: 31% TypeScript, 69% JavaScript

**Priority 1 (Migrate First)**:
- Zustand stores (type safety for actions)
- Service files (API response types)

**Priority 2**:
- UI components with complex props
- Custom hooks

---

## Part 8: Production Readiness Checklist

### Before Launch (Week 1-2)

- [ ] **SEC-001**: Add auth to AI chat endpoint
- [ ] **SEC-002**: Encrypt Concept2 OAuth tokens
- [ ] **SEC-003**: Add webhook signature verification
- [ ] **SEC-006**: Fix admin role property check
- [ ] Add input validation to 14 unvalidated routes
- [ ] Remove hardcoded admin password from seed.js
- [ ] Replace console.error with logger in server files

### Before Beta (Week 3-4)

- [ ] Implement focus trap in GlassModal
- [ ] Add aria-labels to all icon buttons
- [ ] Associate form labels with inputs
- [ ] Add keyboard navigation to LineupBoard
- [ ] Migrate design tokens (top 10 files)
- [ ] Increase test coverage to 30%

### Before GA (Week 5-8)

- [ ] Complete design token migration
- [ ] Fix all WCAG 2.1 AA violations
- [ ] Reach 70% test coverage
- [ ] Refactor large files
- [ ] Implement command palette
- [ ] Complete mobile dock integration

---

## Part 9: Sprint Planning

### Sprint 1 (Security Hardening)

**Duration**: 1 week
**Focus**: Critical security fixes

| Task | File | Effort |
|------|------|--------|
| Add auth to AI chat | ai.js | 2h |
| Encrypt OAuth tokens | concept2Service.js | 4h |
| Add webhook signature verification | concept2.js | 4h |
| Fix admin role check | index.js, ai.js | 1h |
| Add input validation to routes | 14 files | 1d |
| Tighten rate limiting | security.js | 2h |

### Sprint 2 (Accessibility P0)

**Duration**: 1 week
**Focus**: Critical accessibility issues

| Task | File | Effort |
|------|------|--------|
| Implement focus trap | GlassModal.jsx | 4h |
| Add ARIA dialog attributes | GlassModal.jsx | 2h |
| Add keyboard nav to LineupBoard | LineupBoard.tsx | 1d |
| Add aria-labels to icon buttons | 20+ files | 1d |
| Associate form labels | LoginPage, RegisterPage | 4h |

### Sprint 3 (Design System)

**Duration**: 1 week
**Focus**: Design token migration (high-traffic files)

| Task | Files | Effort |
|------|-------|--------|
| Migrate AdminPanel.jsx | 70 violations | 4h |
| Migrate auth modals | LoginModal, RegisterModal | 4h |
| Migrate ranking components | RankingsDisplay | 3h |
| Migrate erg data components | ErgDataTable, AddErgTestModal | 4h |
| Fix animation durations | GlassCard, Card, SpotlightBentoCard | 2h |

### Sprint 4 (Code Quality)

**Duration**: 1 week
**Focus**: Clean up technical debt

| Task | Scope | Effort |
|------|-------|--------|
| Remove frontend console.logs | 50+ files | 4h |
| Migrate server to logger | 60+ files | 1d |
| Split RacingPage.jsx | 1 file → 4 | 4h |
| Split AILineupOptimizer.jsx | 1 file → 5 | 4h |
| Add barrel exports | 4 directories | 2h |

### Sprint 5-8 (Testing)

**Duration**: 4 weeks
**Focus**: Reach 70% coverage

See `/home/swd/RowLab/docs/TEST_PLAN.md` for detailed test implementation plan.

### Sprint 9 (Performance Optimization)

**Duration**: 1 week
**Focus**: Critical performance improvements

| Task | File | Effort |
|------|------|--------|
| Add React.memo to list components | AthleteCard.jsx, Seat.jsx | 2h |
| Implement list virtualization | AthleteBank.jsx, AthletesPage.jsx | 1d |
| Add lazy loading to images | LandingPage.jsx, AthleteCard.jsx | 4h |
| Convert landing images to WebP | public/images/landing/ | 2h |
| Remove animation stagger on large lists | AthletesPage.jsx:493 | 1h |
| Fix duration-300 violations | Card.jsx:41,63,84 | 1h |
| Add API response caching (SWR/React Query) | All stores | 1d |
| Add AbortController to fetches | Dashboard.jsx, stores | 4h |

---

## Part 10: Performance Analysis Results

### Performance Scorecard

| Category | Score | Grade |
|----------|-------|-------|
| Bundle Splitting | 8/10 | Good |
| Route Code Splitting | 10/10 | Excellent |
| React Memoization | 3/10 | Poor |
| List Virtualization | 0/10 | Missing |
| Image Optimization | 2/10 | Poor |
| Animation Performance | 7/10 | Good |
| API Caching | 2/10 | Poor |

**Overall Performance Score: 4.6/10**

### Critical Performance Issues

#### Missing React.memo (HIGH)
Zero components use `React.memo` despite being rendered in lists:
- `AthleteCard` - `/home/swd/RowLab/src/components/AthleteBank/AthleteCard.jsx:29`
- `Seat` - `/home/swd/RowLab/src/components/BoatDisplay/Seat.jsx:10`
- `AthleteCard` (AthletesPage) - `/home/swd/RowLab/src/pages/AthletesPage.jsx:43`

#### No List Virtualization (HIGH)
No virtualization library used. Components render ALL items:
- `AthleteBank` grid - 100+ athletes
- `AthletesPage` grid/list - 100+ athletes
- `ErgDataTable` - Potentially 1000s of rows

#### Image Optimization (HIGH)
- Landing images total 1.8MB (JPG format)
- `crew-on-water.jpg` - 653KB (largest)
- No `loading="lazy"` on any images
- No WebP/AVIF alternatives
- No responsive `srcset`

#### Animation Duration Violations
- `duration-300` in Card.jsx (lines 41, 63, 84) exceeds 200ms limit
- Stagger animations on large lists: `delay: i * 0.02` can exceed seconds

#### API Patterns (POOR)
- No centralized caching layer
- No request deduplication
- No AbortController for cancellation
- No stale-while-revalidate pattern

### Bundle Analysis

Good practices:
- Manual chunks for vendor splitting (react, three, animation, chart, dnd, export)
- Bundle visualizer enabled

Issues:
- Three.js (~500KB) always loaded but only used on single page
- Framer Motion (~50KB) in main bundle
- Recharts (~200KB) loaded eagerly

---

## Part 11: Success Metrics

### Technical Quality

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Test Coverage | ~5% | 70%+ | 8 weeks |
| Security Vulnerabilities | 15 | 0 Critical | 2 weeks |
| WCAG Violations | 47 | 0 Critical | 4 weeks |
| Design Token Compliance | 60% | 100% | 4 weeks |
| Performance Score | 4.6/10 | 8+/10 | 3 weeks |
| Lighthouse Performance | TBD | 90+ | 4 weeks |
| Lighthouse Accessibility | TBD | 90+ | 4 weeks |

### User Experience

| Metric | Target | Timeline |
|--------|--------|----------|
| Error Rate | <1% | 4 weeks |
| Page Load (LCP) | <2.5s | 4 weeks |
| Input Delay (FID) | <100ms | 4 weeks |
| Layout Shift (CLS) | <0.1 | 4 weeks |

---

## Appendix A: Performance Fixes

| Issue | File | Line | Priority |
|-------|------|------|----------|
| Add React.memo | AthleteCard.jsx | 29 | P1 |
| Add React.memo | Seat.jsx | 10 | P1 |
| List virtualization | AthleteBank.jsx | 168-179 | P1 |
| List virtualization | AthletesPage.jsx | 487-501 | P1 |
| Image lazy loading | LandingPage.jsx | 273-279 | P1 |
| Animation stagger cap | AthletesPage.jsx | 493 | P2 |
| duration-300 fix | Card.jsx | 41, 63, 84 | P2 |
| API caching | All stores | - | P2 |
| AbortController | Dashboard.jsx | 101-105 | P2 |

---

## Appendix B: File Reference

### Security Fixes

| Issue | File | Line |
|-------|------|------|
| AI auth | server/routes/ai.js | 257 |
| OAuth encryption | server/services/concept2Service.js | 175-176 |
| Webhook verification | server/routes/concept2.js | 269-287 |
| State verification | server/services/concept2Service.js | 582-590 |
| Password validation | server/routes/auth.js | 54-56 |
| Admin check | server/index.js | 206-218 |

### Accessibility Fixes

| Issue | File | Line |
|-------|------|------|
| Focus trap | src/components/Design/GlassModal.jsx | 73-147 |
| Keyboard nav | src/components/domain/Lineup/LineupBoard.tsx | 131-145 |
| Icon labels | src/pages/AthletesPage.jsx | 224-228, 438-458 |
| Form labels | src/pages/auth/LoginPage.jsx | 11-63 |

### Design Token Files

| File | Violations |
|------|------------|
| src/components/Auth/AdminPanel.jsx | 70 |
| src/pages/Boat3DPage.jsx | 26 |
| src/components/Assignment/ShellManagementModal.jsx | 19 |
| src/components/SeatRacing/RankingsDisplay.jsx | 19 |
| src/components/Auth/RegisterModal.jsx | 18 |
| src/components/ErgData/AddErgTestModal.jsx | 17 |

---

## Appendix C: Competitive Positioning

RowLab's unique advantages over competitors:

1. **vs RegattaCentral**: Modern UI, real-time collaboration, AI optimization
2. **vs CrewLAB**: More affordable, better lineup tools, open API
3. **vs iCrew**: Superior analytics, AI-powered recommendations
4. **vs Rowing in Motion**: No expensive hardware required

Focus post-launch:
- Emphasize "Linear for Rowing" positioning
- Highlight AI lineup optimization as differentiator
- Target club programs priced out of enterprise solutions

---

*This roadmap is a living document. Update as implementation progresses.*
