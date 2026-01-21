# CodeRabbit Issues Fix Plan

Generated: 2026-01-19
Total Issues: 62
Review Type: Uncommitted changes

## Priority Categories

### P0: Security & Authorization (CRITICAL - Fix First)
These issues could allow unauthorized access or data leakage.

1. **server/routes/telemetry.js:15-35** - Missing team ownership verification on GET
2. **server/routes/telemetry.js:63-90** - Missing team verification on POST
3. **server/routes/telemetry.js:155-175** - Missing team verification on DELETE
4. **server/routes/announcements.js:119-128** - OWNERs incorrectly blocked by visibility check
5. **server/services/stripeService.js:322-358** - Null check needed before Stripe API calls

### P1: Runtime Errors (HIGH - Fix Second)
These will cause crashes or undefined behavior.

1. **src/store/aiLineupStore.js:1-41** - Missing `getErrorMessage` function
2. **src/store/announcementStore.js:95-96** - Missing `getErrorMessage` function
3. **src/store/regattaStore.js:54** - Missing `getErrorMessage` function
4. **server/middleware/planLimits.js:8-34** - Missing null check for unknown plans
5. **src/components/Racing/TeamRankingsDisplay.jsx:347-348** - Null check before toFixed()
6. **src/components/Advanced/AILineupOptimizer.jsx:192-195** - Filter always returns true (|| true bug)

### P2: Data Integrity (MEDIUM)
These could cause data corruption or race conditions.

1. **server/services/teamRankingService.js:48-65** - Race condition in getOrCreateExternalTeam
2. **src/store/announcementStore.js:281-286** - Incorrect unreadCount decrement
3. **src/store/announcementStore.js:146-151** - Duplicate unreadCount decrement issue
4. **server/services/stripeService.js:287-300** - Cancel subscription logic error
5. **src/components/Racing/RaceResultsEntry.jsx:119-133** - Mutating state directly

### P3: Error Handling (MEDIUM)
Silent failures that hide problems.

1. **src/components/Advanced/CombinedRankings.jsx:257-259** - Silent catch
2. **src/pages/CommunicationPage.jsx:89-121** - Missing error handling in handlers
3. **src/pages/BillingPage.jsx:259-272** - handleUpgrade silent failure
4. **src/pages/BillingPage.jsx:274-279** - handleManageBilling ignores failures
5. **src/pages/RacingPage.jsx:212-215** - fetchRegatta needs try/catch
6. **src/components/Racing/RaceResultsEntry.jsx:155-163** - setSaving in finally block

### P4: Input Validation (LOW)
Could cause issues with malformed input.

1. **server/routes/telemetry.js:21-23** - parseInt can return NaN
2. **src/pages/RacingPage.jsx:316-323** - parseInt without NaN guard
3. **server/services/regattaService.js:31-46** - Season string validation
4. **src/store/teamRankingsStore.js:21-36** - URL encode season parameter
5. **src/store/teamRankingsStore.js:38-53** - URL encode boatClass parameter

### P5: React Best Practices (LOW)
Non-breaking but should be fixed.

1. **src/pages/auth/RegisterPage.jsx:322-334** - Use navigate() instead of window.location
2. **src/pages/auth/LoginPage.jsx:292** - Use navigate() instead of window.location
3. **src/pages/SettingsPage.jsx:502-505** - Sign Out button missing onClick
4. **src/pages/SettingsPage.jsx:512-515** - Delete Account button missing handler
5. **src/components/Communication/AnnouncementForm.jsx:153-163** - Form reset on create mode

### P6: Minor/Docs (SKIP FOR NOW)
Documentation and style issues.

- docs/self-hosted-setup.md placeholder URLs
- .claude/backups documentation wording
- package.json stripe version

---

## Execution Plan

### Phase 1: Create Shared Utilities (5 min)
Create `src/utils/errorUtils.js` with `getErrorMessage` helper to fix 3 stores at once.

### Phase 2: Fix Security Issues (15 min)
Fix telemetry authorization checks and Stripe null guards.

### Phase 3: Fix Runtime Errors (10 min)
Import getErrorMessage in stores, add null checks.

### Phase 4: Fix Data Integrity (10 min)
Add upsert pattern, fix state mutation issues.

### Phase 5: Fix Error Handling (10 min)
Add try/catch blocks with proper error state.

### Phase 6: Fix Input Validation (5 min)
Add parseInt guards and URL encoding.

### Phase 7: React Best Practices (5 min)
Replace window.location with navigate().

---

## Files to Modify

### New Files
- `src/utils/errorUtils.js` - Shared error message helper

### Critical Files (P0-P1)
- server/routes/telemetry.js
- server/routes/announcements.js
- server/middleware/planLimits.js
- server/services/stripeService.js
- src/store/aiLineupStore.js
- src/store/announcementStore.js
- src/store/regattaStore.js
- src/components/Racing/TeamRankingsDisplay.jsx
- src/components/Advanced/AILineupOptimizer.jsx

### Important Files (P2-P3)
- server/services/teamRankingService.js
- src/components/Racing/RaceResultsEntry.jsx
- src/components/Advanced/CombinedRankings.jsx
- src/pages/CommunicationPage.jsx
- src/pages/BillingPage.jsx
- src/pages/RacingPage.jsx

### Minor Files (P4-P5)
- src/store/teamRankingsStore.js
- server/services/regattaService.js
- src/pages/auth/RegisterPage.jsx
- src/pages/auth/LoginPage.jsx
- src/pages/SettingsPage.jsx
- src/components/Communication/AnnouncementForm.jsx
