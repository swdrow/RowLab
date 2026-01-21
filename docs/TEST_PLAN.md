# RowLab Comprehensive Test Plan

## Executive Summary

**Current Coverage: ~5%** (9 test files exist out of ~200+ source files)
**Target Coverage: 70%+**

### Existing Test Files (9 total)

| File | Status | Tests |
|------|--------|-------|
| `src/components/ui/Button.test.jsx` | Complete | 28 tests |
| `src/components/ui/Card.test.jsx` | Complete | 21 tests |
| `src/store/authStore.test.ts` | Complete | 17 tests |
| `src/store/lineupStore.test.ts` | Complete | 12 tests |
| `src/test/api/auth.test.ts` | Complete | 10 tests |
| `server/tests/concept2Service.test.js` | Complete | 12 tests |
| `src/components/Coxswain/BoatRoster.test.jsx` | Complete | 10 tests |
| `src/components/Coxswain/CommunicationPanel.test.jsx` | Exists | TBD |
| `src/components/Coxswain/WorkoutEntry.test.jsx` | Exists | TBD |

---

## Test Strategy

### Test Pyramid Approach
```
          /\
         /  \
        / E2E \         (~10 tests) - Critical user journeys
       /--------\
      /          \
     / Integration \    (~50 tests) - API routes + DB
    /--------------\
   /                \
  /   Unit Tests     \  (~300+ tests) - Components, stores, services
 /--------------------\
```

### Testing Framework Stack
- **Frontend**: Vitest + React Testing Library + jsdom
- **Backend**: Vitest + Supertest (for API testing)
- **E2E**: Playwright (recommended) or Cypress
- **Mocking**: vi.fn(), MSW for API mocking

---

## Priority 1: Critical Path (Must Have)

### 1.1 Authentication & Authorization

#### Frontend Stores
| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/store/authStore.js` | `authStore.test.ts` | DONE | 17 |

#### Backend Auth
| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `server/middleware/auth.js` | `auth.middleware.test.js` | P1 | 15 |
| `server/services/authService.js` | `authService.test.js` | P1 | 20 |
| `server/services/tokenService.js` | `tokenService.test.js` | P1 | 10 |
| `server/routes/auth.js` | `auth.routes.test.js` | P1 | 25 |

**Test Cases for auth.middleware.test.js:**
```javascript
describe('authenticateToken', () => {
  it('should reject requests without Authorization header')
  it('should reject requests with invalid token format')
  it('should reject expired tokens')
  it('should reject tokens with invalid signature')
  it('should attach user to request with valid token')
  it('should extract activeTeamId from token payload')
  it('should extract activeTeamRole from token payload')
})

describe('requireRole', () => {
  it('should allow OWNER for OWNER-only routes')
  it('should allow COACH for COACH-or-higher routes')
  it('should reject ATHLETE for COACH-only routes')
  it('should reject GUEST for authenticated routes')
  it('should return 403 with FORBIDDEN error code')
})

describe('teamIsolation', () => {
  it('should attach teamFilter to request')
  it('should reject requests without activeTeamId')
})
```

### 1.2 Core Data Stores

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/store/lineupStore.js` | `lineupStore.test.ts` | DONE | 12 |
| `src/store/ergDataStore.js` | `ergDataStore.test.js` | P1 | 15 |
| `src/store/shellStore.js` | `shellStore.test.js` | P1 | 10 |
| `src/store/seatRaceStore.js` | `seatRaceStore.test.js` | P1 | 12 |
| `src/store/settingsStore.js` | `settingsStore.test.js` | P1 | 8 |

**Test Cases for ergDataStore.test.js:**
```javascript
describe('ergDataStore', () => {
  describe('initial state', () => {
    it('should have empty tests array')
    it('should have null selectedAthlete')
    it('should not be loading')
  })

  describe('fetchTests', () => {
    it('should fetch tests for team')
    it('should set loading state during fetch')
    it('should handle fetch errors gracefully')
  })

  describe('addTest', () => {
    it('should add new erg test')
    it('should validate test data before adding')
    it('should update athlete rankings after add')
  })

  describe('computeRankings', () => {
    it('should rank athletes by 2k time')
    it('should handle ties correctly')
    it('should filter by weight class when specified')
  })
})
```

### 1.3 Critical Backend Services

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `server/services/marginCalculationService.js` | `marginCalculation.test.js` | P1 | 20 |
| `server/services/teamService.js` | `teamService.test.js` | P1 | 15 |
| `server/services/athleteService.js` | `athleteService.test.js` | P1 | 18 |
| `server/services/lineupService.js` | `lineupService.test.js` | P1 | 15 |
| `server/services/seatRaceService.js` | `seatRaceService.test.js` | P1 | 12 |

**Test Cases for marginCalculationService.test.js:**
```javascript
describe('MarginCalculationService', () => {
  describe('calculateMargin', () => {
    it('should calculate positive margin when boat1 wins')
    it('should calculate negative margin when boat2 wins')
    it('should return 0 for dead heat')
    it('should apply handicap adjustments correctly')
    it('should handle decimal seconds precision')
  })

  describe('calculateSwing', () => {
    it('should calculate positive swing when margin increases')
    it('should calculate negative swing when margin decreases')
    it('should return 0 for no change')
  })

  describe('estimatePerformanceDiff', () => {
    it('should divide swing by 2')
    it('should handle negative swings')
  })

  describe('findSwappedAthletes', () => {
    it('should identify athletes who changed boats')
    it('should list unchanged athletes')
    it('should handle missing athlete data')
  })

  describe('analyzePiecePair', () => {
    it('should throw if fewer than 2 boats')
    it('should sort boats by name for consistency')
    it('should generate interpretation string')
    it('should identify better performing athlete')
  })

  describe('analyzeSession', () => {
    it('should analyze consecutive piece pairs')
    it('should skip pairs with missing data')
    it('should return empty array for single piece')
  })
})
```

---

## Priority 2: UI Components

### 2.1 Base UI Components

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/components/ui/Button.jsx` | `Button.test.jsx` | DONE | 28 |
| `src/components/ui/Card.jsx` | `Card.test.jsx` | DONE | 21 |
| `src/components/ui/Input.jsx` | `Input.test.jsx` | P2 | 25 |
| `src/components/ui/Badge.jsx` | `Badge.test.jsx` | P2 | 8 |
| `src/components/ui/Typography.jsx` | `Typography.test.jsx` | P2 | 10 |
| `src/components/ui/SpotlightCard.jsx` | `SpotlightCard.test.jsx` | P3 | 6 |

**Test Cases for Input.test.jsx:**
```javascript
describe('Input', () => {
  it('renders input element')
  it('accepts type prop')
  it('applies error styles when error prop is true')
  it('forwards ref correctly')
  it('accepts custom className')
  it('handles disabled state')
  it('handles placeholder text')
})

describe('Label', () => {
  it('renders label text')
  it('shows required indicator when required')
  it('associates with input via htmlFor')
})

describe('InputError', () => {
  it('renders error message')
  it('applies error text color')
})

describe('PasswordInput', () => {
  it('renders as password type by default')
  it('toggles to text type when show button clicked')
  it('shows eye icon when hidden')
  it('shows eye-off icon when visible')
})

describe('Textarea', () => {
  it('renders textarea element')
  it('applies error styles')
  it('accepts rows prop')
})
```

### 2.2 Domain Components

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/components/AthleteBank/AthleteCard.jsx` | `AthleteCard.test.jsx` | P2 | 15 |
| `src/components/AthleteBank/AthleteBank.jsx` | `AthleteBank.test.jsx` | P2 | 12 |
| `src/components/BoatDisplay/BoatDisplay.jsx` | `BoatDisplay.test.jsx` | P2 | 18 |
| `src/components/BoatDisplay/Seat.jsx` | `Seat.test.jsx` | P2 | 12 |
| `src/components/BoatDisplay/CoxswainSeat.jsx` | `CoxswainSeat.test.jsx` | P2 | 8 |
| `src/components/RankingDisplay/RankingBadge.jsx` | `RankingBadge.test.jsx` | P2 | 6 |

**Test Cases for AthleteCard.test.jsx:**
```javascript
describe('AthleteCard', () => {
  const mockAthlete = {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    side: 'P',
    rank: 3,
    ergScore: '6:15.0'
  }

  it('renders athlete name')
  it('displays side preference indicator')
  it('shows ranking badge')
  it('displays erg score')
  it('handles missing erg data gracefully')
  it('applies drag styles when dragging')
  it('calls onClick when clicked')
  it('shows selected state')
  it('handles empty athlete prop')
  it('displays avatar or initials')
})
```

### 2.3 Assignment Components

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/components/Assignment/AssignmentControls.jsx` | `AssignmentControls.test.jsx` | P2 | 15 |
| `src/components/Assignment/BoatSelectionModal.jsx` | `BoatSelectionModal.test.jsx` | P2 | 10 |
| `src/components/Assignment/SavedLineupsModal.jsx` | `SavedLineupsModal.test.jsx` | P2 | 12 |
| `src/components/Assignment/LineupToolbar.jsx` | `LineupToolbar.test.jsx` | P2 | 10 |
| `src/components/Assignment/ShellManagementModal.jsx` | `ShellManagementModal.test.jsx` | P2 | 10 |

### 2.4 Auth Components

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/components/Auth/LoginModal.jsx` | `LoginModal.test.jsx` | P2 | 12 |
| `src/components/Auth/RegisterModal.jsx` | `RegisterModal.test.jsx` | P2 | 15 |
| `src/components/Auth/AuthButton.jsx` | `AuthButton.test.jsx` | P2 | 8 |
| `src/components/Auth/AdminPanel.jsx` | `AdminPanel.test.jsx` | P2 | 10 |

---

## Priority 3: Backend Routes (Integration Tests)

### 3.1 Core API Routes

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `server/routes/auth.js` | `auth.routes.test.js` | P1 | 25 |
| `server/routes/teams.js` | `teams.routes.test.js` | P2 | 20 |
| `server/routes/athletes.js` | `athletes.routes.test.js` | P2 | 18 |
| `server/routes/lineups.js` | `lineups.routes.test.js` | P2 | 15 |
| `server/routes/ergData.js` | `ergData.routes.test.js` | P2 | 15 |
| `server/routes/ergTests.js` | `ergTests.routes.test.js` | P2 | 12 |

**Test Cases for teams.routes.test.js (Integration):**
```javascript
describe('Teams API', () => {
  describe('POST /api/v1/teams', () => {
    it('should create team with valid data')
    it('should reject unauthenticated requests')
    it('should validate team name length')
    it('should set creator as OWNER')
    it('should generate unique invite code')
  })

  describe('GET /api/v1/teams/:id', () => {
    it('should return team details for members')
    it('should reject non-members')
    it('should include member count')
  })

  describe('POST /api/v1/teams/:id/invite', () => {
    it('should generate invite link for OWNER/COACH')
    it('should reject ATHLETE role')
    it('should set expiration date')
  })

  describe('DELETE /api/v1/teams/:id/members/:userId', () => {
    it('should allow OWNER to remove members')
    it('should reject self-removal of last OWNER')
    it('should reject COACH removing OWNER')
  })
})
```

### 3.2 Feature API Routes

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `server/routes/seatRaces.js` | `seatRaces.routes.test.js` | P2 | 15 |
| `server/routes/rankings.js` | `rankings.routes.test.js` | P2 | 10 |
| `server/routes/boatConfigs.js` | `boatConfigs.routes.test.js` | P3 | 10 |
| `server/routes/concept2.js` | `concept2.routes.test.js` | P3 | 12 |
| `server/routes/subscriptions.js` | `subscriptions.routes.test.js` | P3 | 10 |

### 3.3 Advanced Feature Routes

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `server/routes/ai.js` | `ai.routes.test.js` | P3 | 8 |
| `server/routes/aiLineup.js` | `aiLineup.routes.test.js` | P3 | 10 |
| `server/routes/regattas.js` | `regattas.routes.test.js` | P3 | 12 |
| `server/routes/announcements.js` | `announcements.routes.test.js` | P3 | 10 |
| `server/routes/telemetry.js` | `telemetry.routes.test.js` | P3 | 8 |

---

## Priority 4: Hooks

| File | Test File | Priority | Est. Tests |
|------|-----------|----------|------------|
| `src/hooks/useAuth.js` | `useAuth.test.js` | P2 | 20 |
| `src/hooks/useCollaboration.ts` | `useCollaboration.test.ts` | P3 | 12 |
| `src/hooks/useDarkMode.js` | `useDarkMode.test.js` | P3 | 6 |
| `src/hooks/useMediaQuery.js` | `useMediaQuery.test.js` | P3 | 8 |
| `src/hooks/useUndoRedo.ts` | `useUndoRedo.test.ts` | P3 | 10 |
| `src/hooks/useKeyboardShortcuts.ts` | `useKeyboardShortcuts.test.ts` | P3 | 12 |

**Test Cases for useAuth.test.js:**
```javascript
describe('useAuth', () => {
  describe('login', () => {
    it('should call storeLogin with credentials')
    it('should redirect to /app on success')
    it('should redirect to original destination if present')
    it('should not redirect on failure')
  })

  describe('logout', () => {
    it('should call storeLogout')
    it('should redirect to /login')
  })

  describe('hasRole', () => {
    it('should return true for matching role')
    it('should return true for any of multiple roles')
    it('should return false for non-matching role')
  })

  describe('isCoachOrOwner', () => {
    it('should return true for OWNER')
    it('should return true for COACH')
    it('should return false for ATHLETE')
  })
})

describe('useRequireAuth', () => {
  it('should redirect to login if not authenticated')
  it('should preserve original location in state')
  it('should not redirect while initializing')
  it('should return loading state correctly')
})

describe('useRequireRole', () => {
  it('should redirect if role not in required list')
  it('should allow access for matching role')
})

describe('useRequireTeam', () => {
  it('should redirect to onboarding if no team')
  it('should allow access with team')
})
```

---

## Priority 5: E2E Tests (Playwright)

### 5.1 Critical User Journeys

| Journey | Test File | Priority | Est. Tests |
|---------|-----------|----------|------------|
| User Registration | `auth.spec.ts` | P1 | 5 |
| User Login/Logout | `auth.spec.ts` | P1 | 4 |
| Create Team | `team.spec.ts` | P1 | 3 |
| Join Team via Invite | `team.spec.ts` | P1 | 3 |
| Create Lineup | `lineup.spec.ts` | P2 | 6 |
| Drag-Drop Athletes | `lineup.spec.ts` | P2 | 4 |
| Add Erg Test | `ergData.spec.ts` | P2 | 4 |
| View Rankings | `rankings.spec.ts` | P3 | 3 |

**E2E Test Example (auth.spec.ts):**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('.success-message')).toContainText('Account created');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/app');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Test Infrastructure Requirements

### 1. Test Setup Files

**src/test/setup.ts** (exists, needs enhancement):
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### 2. Test Utilities

**src/test/utils.tsx** (create):
```typescript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Wrapper with providers
function AllTheProviders({ children }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Mock Factories

**src/test/factories/athlete.ts** (create):
```typescript
export function createMockAthlete(overrides = {}) {
  return {
    id: Math.random().toString(36).substr(2, 9),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    side: 'P',
    weightClass: 'HEAVYWEIGHT',
    ...overrides,
  };
}

export function createMockAthletes(count: number) {
  return Array.from({ length: count }, (_, i) =>
    createMockAthlete({
      id: `athlete-${i}`,
      firstName: `Athlete`,
      lastName: `${i + 1}`,
    })
  );
}
```

**src/test/factories/boat.ts** (create):
```typescript
export function createMockBoatConfig(overrides = {}) {
  return {
    id: 'boat-1',
    name: 'Varsity 8+',
    numSeats: 8,
    hasCoxswain: true,
    ...overrides,
  };
}

export function createMockBoat(config, athletes = []) {
  const seats = Array.from({ length: config.numSeats }, (_, i) => ({
    seatNumber: config.numSeats - i,
    athlete: athletes[i] || null,
  }));

  return {
    id: `boat-instance-${Date.now()}`,
    configId: config.id,
    name: config.name,
    seats,
    coxswain: config.hasCoxswain ? null : undefined,
  };
}
```

### 4. API Mocking with MSW (recommended)

**src/test/mocks/handlers.ts** (create):
```typescript
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          user: { id: '1', email: 'test@test.com', name: 'Test User' },
          teams: [{ id: 'team1', name: 'Test Team' }],
          activeTeamId: 'team1',
          accessToken: 'mock-token',
        },
      })
    );
  }),

  rest.get('/api/v1/teams/:teamId/athletes', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          athletes: createMockAthletes(10),
        },
      })
    );
  }),
];
```

---

## CI/CD Pipeline Configuration

### GitHub Actions Workflow

**.github/workflows/test.yml** (create):
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: rowlab_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/rowlab_test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/rowlab_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up test utilities and factories
- [ ] Implement MSW handlers for API mocking
- [ ] Write remaining auth middleware tests
- [ ] Write tokenService tests
- [ ] Write authService tests
- [ ] Complete marginCalculationService tests

**Estimated new tests: ~80**

### Phase 2: Core Stores (Week 3-4)
- [ ] ergDataStore tests
- [ ] shellStore tests
- [ ] seatRaceStore tests
- [ ] settingsStore tests
- [ ] boatConfigStore tests
- [ ] rankingsStore tests

**Estimated new tests: ~70**

### Phase 3: UI Components (Week 5-6)
- [ ] Input component tests
- [ ] Badge component tests
- [ ] Typography component tests
- [ ] AthleteCard tests
- [ ] AthleteBank tests
- [ ] BoatDisplay tests
- [ ] Seat tests

**Estimated new tests: ~85**

### Phase 4: Backend Routes (Week 7-8)
- [ ] teams routes integration tests
- [ ] athletes routes integration tests
- [ ] lineups routes integration tests
- [ ] ergData routes integration tests
- [ ] seatRaces routes integration tests

**Estimated new tests: ~80**

### Phase 5: Hooks & E2E (Week 9-10)
- [ ] useAuth hook tests
- [ ] useCollaboration tests
- [ ] useDarkMode tests
- [ ] E2E auth flow tests
- [ ] E2E lineup builder tests
- [ ] E2E team management tests

**Estimated new tests: ~55**

---

## Test Count Summary

| Category | Existing | To Add | Total |
|----------|----------|--------|-------|
| Frontend Unit (Stores) | 29 | 70 | 99 |
| Frontend Unit (Components) | 49 | 140 | 189 |
| Frontend Unit (Hooks) | 0 | 68 | 68 |
| Backend Unit (Services) | 12 | 100 | 112 |
| Backend Unit (Middleware) | 0 | 25 | 25 |
| Integration (Routes) | 10 | 130 | 140 |
| E2E | 0 | 32 | 32 |
| **TOTAL** | **100** | **565** | **665** |

---

## Success Criteria

1. **Coverage Targets**
   - Overall: 70%+
   - Critical paths (auth, lineups): 90%+
   - Services: 85%+
   - Components: 70%+

2. **Quality Metrics**
   - Zero flaky tests
   - All tests run in < 2 minutes (unit)
   - Integration tests run in < 5 minutes
   - E2E tests run in < 10 minutes

3. **CI/CD Requirements**
   - All tests pass before merge
   - Coverage report generated
   - Test failures block PR merge

---

## Appendix: File Inventory

### Frontend Components Needing Tests (By Directory)

```
src/components/
├── 3D/
│   └── Boat3DViewer.jsx (P3 - 6 tests)
├── Advanced/
│   ├── AILineupOptimizer.jsx (P3 - 10 tests)
│   ├── CombinedRankings.jsx (P3 - 8 tests)
│   └── TelemetryImport.jsx (P3 - 6 tests)
├── AI/
│   └── LineupAssistant.jsx (P3 - 8 tests)
├── Assignment/
│   ├── AssignmentControls.jsx (P2 - 15 tests)
│   ├── BoatSelectionModal.jsx (P2 - 10 tests)
│   ├── DragDropContext.jsx (P2 - 8 tests)
│   ├── LineupToolbar.jsx (P2 - 10 tests)
│   ├── SavedLineupsModal.jsx (P2 - 12 tests)
│   └── ShellManagementModal.jsx (P2 - 10 tests)
├── AthleteBank/
│   ├── AthleteBank.jsx (P2 - 12 tests)
│   └── AthleteCard.jsx (P2 - 15 tests)
├── Auth/
│   ├── AdminPanel.jsx (P2 - 10 tests)
│   ├── AuthButton.jsx (P2 - 8 tests)
│   ├── LoginModal.jsx (P2 - 12 tests)
│   └── RegisterModal.jsx (P2 - 15 tests)
├── Billing/
│   └── UpgradePrompt.jsx (P3 - 6 tests)
├── BoatDisplay/
│   ├── BoatDisplay.jsx (P2 - 18 tests)
│   ├── CompactBoatView.jsx (P3 - 8 tests)
│   ├── CoxswainSeat.jsx (P2 - 8 tests)
│   └── Seat.jsx (P2 - 12 tests)
├── Charts/
│   └── ErgTrendChart.jsx (P3 - 6 tests)
├── Communication/
│   ├── AnnouncementCard.jsx (P3 - 6 tests)
│   ├── AnnouncementDetail.jsx (P3 - 8 tests)
│   ├── AnnouncementForm.jsx (P3 - 10 tests)
│   └── AnnouncementList.jsx (P3 - 8 tests)
├── Concept2/
│   └── Concept2Connection.jsx (P3 - 8 tests)
├── Coxswain/
│   ├── BoatRoster.jsx (DONE - 10 tests)
│   ├── CommunicationPanel.jsx (EXISTS)
│   └── WorkoutEntry.jsx (EXISTS)
├── Dashboard/
│   ├── AthleteQuickView.jsx (P3 - 8 tests)
│   ├── LineupCards.jsx (P3 - 8 tests)
│   ├── PersonalBests.jsx (P3 - 6 tests)
│   ├── PMCChart.jsx (P3 - 6 tests)
│   ├── RankingsTable.jsx (P3 - 8 tests)
│   ├── RecentWorkoutHero.jsx (P3 - 6 tests)
│   ├── ScheduleWidget.jsx (P3 - 6 tests)
│   ├── TeamSummary.jsx (P3 - 8 tests)
│   ├── TrainingVolumeChart.jsx (P3 - 6 tests)
│   └── WorkoutConfigurator.jsx (P3 - 10 tests)
├── Design/ (Glass components - P3)
│   ├── GlassBadge.jsx (4 tests)
│   ├── GlassButton.jsx (6 tests)
│   ├── GlassCard.jsx (6 tests)
│   ├── GlassContainer.jsx (4 tests)
│   ├── GlassInput.jsx (6 tests)
│   ├── GlassModal.jsx (8 tests)
│   └── GlassNavbar.jsx (6 tests)
├── ErgData/
│   ├── AddErgTestModal.jsx (P2 - 15 tests)
│   └── ErgDataModal.jsx (P2 - 10 tests)
├── Export/
│   └── PDFExportModal.jsx (P3 - 8 tests)
├── Generative/
│   ├── AuroraBackground.tsx (P4 - 4 tests)
│   ├── FieldLines.tsx (P4 - 4 tests)
│   └── OrganicBlob.tsx (P4 - 4 tests)
├── Layout/
│   ├── Breadcrumbs.tsx (P3 - 6 tests)
│   ├── MobileDock.tsx (P3 - 8 tests)
│   ├── PageContainer.tsx (P3 - 4 tests)
│   ├── TopNav.tsx (P3 - 8 tests)
│   └── WorkspaceSwitcher.tsx (P3 - 6 tests)
├── PerformanceView/
│   ├── ErgDataTable.jsx (P2 - 12 tests)
│   ├── PerformanceChart.jsx (P3 - 8 tests)
│   └── PerformanceModal.jsx (P3 - 8 tests)
├── Racing/
│   ├── RaceResultsEntry.jsx (P3 - 10 tests)
│   ├── RegattaList.jsx (P3 - 8 tests)
│   └── TeamRankingsDisplay.jsx (P3 - 8 tests)
├── RankingDisplay/
│   └── RankingBadge.jsx (P2 - 6 tests)
├── SeatRacing/
│   ├── RankingsDisplay.jsx (P2 - 10 tests)
│   ├── SeatRaceEntryForm.jsx (P2 - 12 tests)
│   └── SeatRaceSessionList.jsx (P2 - 8 tests)
├── compound/
│   └── Sidebar/Sidebar.tsx (P3 - 10 tests)
├── domain/
│   ├── Athlete/AthleteBankPanel.tsx (P2 - 10 tests)
│   ├── Boat/BoatColumn.tsx (P2 - 10 tests)
│   ├── Boat/SeatSlot.tsx (P2 - 8 tests)
│   └── Lineup/LineupBoard.tsx (P2 - 12 tests)
├── erg/
│   └── CSVImportModal.jsx (P2 - 10 tests)
├── landing/
│   ├── DataStreamTicker.jsx (P3 - 6 tests)
│   ├── HeroCockpitCard.jsx (P3 - 8 tests)
│   └── SpotlightBentoCard.jsx (P3 - 6 tests)
└── ui/
    ├── Badge.jsx (P2 - 8 tests)
    ├── Button.jsx (DONE - 28 tests)
    ├── Card.jsx (DONE - 21 tests)
    ├── Input.jsx (P2 - 25 tests)
    ├── SpotlightCard.jsx (P3 - 6 tests)
    └── Typography.jsx (P2 - 10 tests)
```

### Backend Services Needing Tests

```
server/services/
├── aiLineupOptimizerService.js (P3 - 15 tests)
├── aiService.js (P3 - 10 tests)
├── announcementService.js (P3 - 10 tests)
├── athleteService.js (P1 - 18 tests)
├── authService.js (P1 - 20 tests)
├── autoPlanService.js (P3 - 8 tests)
├── boatConfigService.js (P2 - 10 tests)
├── combinedScoringService.js (P2 - 12 tests)
├── concept2Service.js (DONE - 12 tests)
├── csvImportService.js (P2 - 12 tests)
├── eloRatingService.js (P2 - 10 tests)
├── ergTestService.js (P2 - 12 tests)
├── inviteService.js (P2 - 10 tests)
├── lineupService.js (P1 - 15 tests)
├── marginCalculationService.js (P1 - 20 tests)
├── racePredictorService.js (P3 - 8 tests)
├── regattaService.js (P3 - 10 tests)
├── seatRaceService.js (P1 - 12 tests)
├── settingsService.js (P2 - 8 tests)
├── shellService.js (P2 - 10 tests)
├── speedCalculationService.js (P2 - 8 tests)
├── stripeService.js (P3 - 10 tests)
├── teamRankingService.js (P2 - 10 tests)
├── teamService.js (P1 - 15 tests)
├── telemetryService.js (P3 - 8 tests)
├── tokenService.js (P1 - 10 tests)
├── waterSessionService.js (P3 - 8 tests)
└── workoutService.js (P2 - 10 tests)
```

### Backend Routes Needing Tests

```
server/routes/
├── ai.js (P3 - 8 tests)
├── aiLineup.js (P3 - 10 tests)
├── announcements.js (P3 - 10 tests)
├── athletes.js (P2 - 18 tests)
├── auth.js (P1 - 25 tests)
├── boatConfigs.js (P3 - 10 tests)
├── calendar.js (P3 - 8 tests)
├── combinedScoring.js (P3 - 8 tests)
├── concept2.js (P3 - 12 tests)
├── ergData.js (P2 - 15 tests)
├── ergTests.js (P2 - 12 tests)
├── externalTeams.js (P3 - 8 tests)
├── health.js (P4 - 2 tests)
├── import.js (P2 - 10 tests)
├── invites.js (P2 - 10 tests)
├── lineups.js (P2 - 15 tests)
├── rankings.js (P2 - 10 tests)
├── regattas.js (P3 - 12 tests)
├── seatRaces.js (P2 - 15 tests)
├── settings.js (P3 - 8 tests)
├── subscriptions.js (P3 - 10 tests)
├── teamRankings.js (P3 - 8 tests)
├── teams.js (P2 - 20 tests)
├── telemetry.js (P3 - 8 tests)
├── waterSessions.js (P3 - 10 tests)
└── workouts.js (P2 - 10 tests)
```
