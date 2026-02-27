# RowLab Development Guide

> Comprehensive guide for setting up, developing, and troubleshooting RowLab

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Common Development Tasks](#common-development-tasks)
- [Testing Guide](#testing-guide)
- [Debugging Guide](#debugging-guide)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **npm** | Comes with Node.js | - |
| **PostgreSQL** | 14+ | [postgresql.org](https://postgresql.org) or use Docker |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |
| **Ollama** (optional) | Latest | For AI features: [ollama.ai](https://ollama.ai) |

#### Quick PostgreSQL Setup with Docker

```bash
docker run -d \
  --name rowlab-postgres \
  -e POSTGRES_USER=rowlab \
  -e POSTGRES_PASSWORD=rowlab_dev \
  -e POSTGRES_DB=rowlab_dev \
  -p 5432:5432 \
  postgres:14-alpine
```

---

## Architecture Overview

### Tech Stack

#### Frontend

```
React 18 (UI Framework)
├── Vite (Build Tool + Dev Server)
├── TailwindCSS (Styling + Custom Design System)
├── Zustand (State Management)
├── React Router (Routing)
└── Additional Libraries
    ├── @dnd-kit (Drag & Drop)
    ├── Framer Motion (Animations)
    ├── Recharts (Data Visualization)
    ├── Three.js + @react-three/fiber (3D Boat Visualization)
    └── Socket.io-client (Real-time Communication)
```

#### Backend

```
Express.js (REST API)
├── PostgreSQL + Prisma (Database + ORM)
├── JWT (Authentication with Refresh Tokens)
├── Helmet + Rate Limiting (Security)
├── Winston (Logging)
├── Node-cron (Background Sync Jobs)
└── Integrations
    ├── Concept2 OAuth (Erg Data Sync)
    ├── Strava OAuth (Activity Sync)
    ├── Ollama (Local LLM for AI Features)
    └── Stripe (Billing - in progress)
```

### Directory Structure

```
RowLab/
│
├── src/                          # Frontend React Application
│   ├── components/               # React Components
│   │   ├── ui/                  # Base Design System Components
│   │   ├── domain/              # Domain-Specific Components (LineupBoard)
│   │   ├── compound/            # Composite Components
│   │   └── [feature-folders]/   # Feature-specific components
│   ├── pages/                   # Route Pages
│   ├── store/                   # Zustand State Stores
│   ├── services/                # API Client Services
│   ├── hooks/                   # Custom React Hooks
│   ├── utils/                   # Utility Functions
│   ├── theme/                   # Design Tokens & Theme
│   ├── types/                   # TypeScript Type Definitions
│   └── test/                    # Frontend Tests
│
├── server/                       # Backend Express Application
│   ├── routes/                  # API Route Handlers
│   │   └── v1/                 # API v1 Routes (multi-tenant)
│   ├── services/                # Business Logic Services
│   ├── middleware/              # Express Middleware (auth, security)
│   ├── utils/                   # Backend Utilities
│   ├── db/                      # Database Connection
│   ├── tests/                   # Backend Tests
│   └── index.js                 # Server Entry Point
│
├── prisma/                       # Database Schema & Migrations
│   ├── schema.prisma            # Prisma Schema Definition
│   ├── migrations/              # Migration History
│   └── seed.js                  # Database Seed Script
│
├── docs/                         # Documentation
├── public/                       # Static Assets
├── config/                       # Configuration Files
└── scripts/                      # Build & Deployment Scripts
```

### State Management Architecture

RowLab uses Zustand for state management with the following stores:

| Store | Purpose |
|-------|---------|
| `authStore` | User authentication, team context, session management |
| `lineupStore` | Boat lineups, athlete assignments, undo/redo |
| `ergDataStore` | Erg test results, workout tracking |
| `seatRaceStore` | Seat racing sessions, pieces, Elo rankings |
| `announcementStore` | Team announcements, notifications |
| `trainingPlanStore` | Training plans, workout assignments |
| `settingsStore` | User preferences, UI settings |
| `subscriptionStore` | Billing, plan management |

**Key Pattern**: Each store is a self-contained module with actions and state. Stores can access other stores via `useAuthStore.getState()` for cross-store dependencies.

### Authentication Flow

```
Client Login Request
    ↓
[POST /api/v1/auth/login]
    ↓
[Verify credentials with bcrypt]
    ↓
[Generate Access Token (JWT, 15m expiry)]
    ↓
[Generate Refresh Token (7d, httpOnly cookie)]
    ↓
[Return user, teams, activeTeamId, accessToken]
    ↓
[Client stores accessToken in authStore]
    ↓
[Client includes Authorization: Bearer <token> in requests]
    ↓
[Token expires after 15m]
    ↓
[POST /api/v1/auth/refresh with refresh token cookie]
    ↓
[Return new accessToken]
```

---

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/samwduncan/RowLab.git
cd RowLab
```

### 2. Install Dependencies

```bash
npm install
```

This installs both frontend and backend dependencies.

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database - PostgreSQL connection
DATABASE_URL="postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev"

# Authentication (REQUIRED)
JWT_SECRET="your-secure-random-string-at-least-32-chars"
JWT_REFRESH_SECRET="another-secure-random-string-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Encryption (REQUIRED for production)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="generate_64_char_hex_string_here"

# Server
PORT=3002
NODE_ENV=development

# Concept2 OAuth (optional - for erg data sync)
CONCEPT2_CLIENT_ID=your_client_id
CONCEPT2_CLIENT_SECRET=your_client_secret
CONCEPT2_REDIRECT_URI=http://localhost:3001/api/v1/concept2/callback
CONCEPT2_WEBHOOK_SECRET=your_webhook_secret

# Strava OAuth (optional - for activity sync)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3001/api/v1/strava/callback

# Storage limit in bytes (20GB default)
STORAGE_LIMIT_BYTES=21474836480
```

**Generate Secure Keys:**

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup

#### Run Migrations

Apply database schema:

```bash
npx prisma migrate dev
```

This creates all tables defined in `prisma/schema.prisma`.

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Seed Database

Create initial admin user and test data:

```bash
npm run db:seed
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

**Change these immediately in production!**

#### Open Prisma Studio (Optional)

Inspect database with GUI:

```bash
npm run db:studio
```

Opens at `http://localhost:5555`.

### 5. Start Development Servers

#### Option A: Single Terminal (Concurrent)

```bash
npm run dev:full
```

This starts both backend (port 3002) and frontend (port 3001) in a single terminal with color-coded output.

#### Option B: Separate Terminals

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

#### Option C: Persistent tmux Session (Recommended for Server)

```bash
npm run dev:tmux
```

Creates a detached tmux session with split panes for backend/frontend. Stop with:

```bash
npm run stop
```

### 6. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Health Check**: http://localhost:3002/api/health

### 7. Verify Setup

Check that everything is working:

```bash
# Backend health
curl http://localhost:3002/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-22T..."}

# Login test (with default admin)
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Common Development Tasks

### Adding a New API Endpoint

#### 1. Define Service Function

**File**: `server/services/myFeatureService.js`

```javascript
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Get all items for a team
 * @param {string} teamId - Team ID
 * @returns {Promise<Array>} Items
 */
export async function getItems(teamId) {
  try {
    const items = await prisma.myModel.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  } catch (error) {
    logger.error('Get items error', { error: error.message, teamId });
    throw new Error('Failed to get items');
  }
}

/**
 * Create a new item
 * @param {string} teamId - Team ID
 * @param {Object} data - Item data
 * @returns {Promise<Object>} Created item
 */
export async function createItem(teamId, data) {
  try {
    const item = await prisma.myModel.create({
      data: {
        ...data,
        teamId,
      },
    });
    logger.info('Item created', { itemId: item.id, teamId });
    return item;
  } catch (error) {
    logger.error('Create item error', { error: error.message, teamId });
    throw new Error('Failed to create item');
  }
}
```

#### 2. Create Route Handler

**File**: `server/routes/myFeature.js`

```javascript
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { getItems, createItem } from '../services/myFeatureService.js';
import { authenticateToken, teamIsolation } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
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
 * GET /api/v1/my-feature
 * List all items for the team
 */
router.get('/', authenticateToken, teamIsolation, async (req, res) => {
  try {
    const items = await getItems(req.user.activeTeamId);
    res.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    logger.error('Get items error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get items' },
    });
  }
});

/**
 * POST /api/v1/my-feature
 * Create a new item
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const item = await createItem(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { item },
      });
    } catch (error) {
      logger.error('Create item error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create item' },
      });
    }
  }
);

export default router;
```

#### 3. Register Route in Server

**File**: `server/index.js`

```javascript
import myFeatureRoutes from './routes/myFeature.js';

// ... other routes

app.use('/api/v1/my-feature', apiLimiter, myFeatureRoutes);
```

#### 4. Create Frontend Service

**File**: `src/services/myFeatureService.js`

```javascript
import axios from 'axios';

const API_BASE = '/api/v1/my-feature';

/**
 * Get all items
 */
export async function getItems() {
  const response = await axios.get(API_BASE);
  return response.data.data.items;
}

/**
 * Create a new item
 */
export async function createItem(data) {
  const response = await axios.post(API_BASE, data);
  return response.data.data.item;
}
```

**Note**: Axios is pre-configured with auth interceptors in `src/services/api.js`.

---

### Adding a New Frontend Page

#### 1. Create Page Component

**File**: `src/pages/MyFeaturePage.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { getItems } from '../services/myFeatureService';
import useAuthStore from '../store/authStore';

export default function MyFeaturePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeTeam } = useAuthStore();

  useEffect(() => {
    loadItems();
  }, [activeTeam]);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Feature</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-gray-800 rounded">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. Add Route

**File**: `src/App.jsx`

```javascript
import MyFeaturePage from './pages/MyFeaturePage';

// Inside Routes:
<Route path="/my-feature" element={<MyFeaturePage />} />
```

#### 3. Add Navigation Link

**File**: `src/components/Layout/Sidebar.jsx`

```javascript
<NavLink to="/my-feature" className="nav-link">
  <Icon icon="feature-icon" />
  My Feature
</NavLink>
```

---

### Adding a New Zustand Store

**File**: `src/store/myFeatureStore.js`

```javascript
import { create } from 'zustand';
import { getItems, createItem } from '../services/myFeatureService';

const useMyFeatureStore = create((set, get) => ({
  // State
  items: [],
  loading: false,
  error: null,

  // Actions
  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await getItems();
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addItem: async (data) => {
    try {
      const newItem = await createItem(data);
      set((state) => ({
        items: [...state.items, newItem],
      }));
      return newItem;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useMyFeatureStore;
```

**Usage in Component:**

```javascript
import useMyFeatureStore from '../store/myFeatureStore';

function MyComponent() {
  const { items, loading, loadItems, addItem } = useMyFeatureStore();

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ...
}
```

---

### Working with the Database

#### Create a New Migration

After modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe_your_change
```

Example:
```bash
npx prisma migrate dev --name add_notes_to_athlete
```

#### Reset Database (Development Only)

**WARNING**: This deletes all data!

```bash
npm run db:reset
```

This runs `prisma migrate reset --force` and re-seeds the database.

#### Query Database Manually

```bash
npx prisma studio
```

Or use `psql`:

```bash
psql postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev
```

#### Common Prisma Patterns

**Find Many with Relations:**
```javascript
const athletes = await prisma.athlete.findMany({
  where: { teamId },
  include: {
    ergTests: {
      where: { testType: '2k' },
      orderBy: { testDate: 'desc' },
      take: 1,
    },
  },
});
```

**Create with Relations:**
```javascript
const lineup = await prisma.lineup.create({
  data: {
    name: 'Varsity 8+',
    teamId,
    assignments: {
      create: [
        { athleteId: 'uuid1', seatNumber: 1, side: 'Port' },
        { athleteId: 'uuid2', seatNumber: 2, side: 'Starboard' },
      ],
    },
  },
  include: { assignments: true },
});
```

**Transaction:**
```javascript
await prisma.$transaction(async (tx) => {
  await tx.athlete.update({ where: { id }, data: { ... } });
  await tx.ergTest.create({ data: { ... } });
});
```

---

## Testing Guide

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Test Structure

RowLab uses **Vitest** for both frontend and backend tests.

#### Frontend Tests

**Location**: `src/test/`

**Setup**: `src/test/setup.ts` configures jsdom and testing-library.

**Example Store Test** (`src/store/authStore.test.ts`):

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      accessToken: null,
    });
  });

  it('should login user', async () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    vi.mock('../services/authService', () => ({
      login: vi.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'token123',
      }),
    }));

    const { login } = useAuthStore.getState();
    await login('test@test.com', 'password');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('test@test.com');
  });
});
```

#### Backend Tests

**Location**: `server/tests/`

**Setup**: `server/tests/setup.js`

**Example Service Test** (`server/tests/concept2Service.test.js`):

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncWorkouts } from '../services/concept2Service';

describe('Concept2 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sync workouts from Concept2', async () => {
    // Mock Prisma
    const mockPrisma = {
      workout: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'workout1' }),
      },
    };

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'c2-1', distance: 2000 }] }),
    });

    const result = await syncWorkouts('user1', mockPrisma);
    expect(result.synced).toBe(1);
  });
});
```

### Mocking Patterns

#### Mock API Calls

```javascript
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');
import axios from 'axios';

axios.get.mockResolvedValue({ data: { items: [] } });
```

#### Mock Prisma

```javascript
const mockPrisma = {
  athlete: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: '1' }),
  },
};
```

#### Mock Zustand Store

```javascript
vi.mock('../store/authStore', () => ({
  default: () => ({
    user: { id: '1', email: 'test@test.com' },
    isAuthenticated: true,
  }),
}));
```

### Test Coverage

View coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

Target: **>80%** coverage for critical paths (auth, lineup logic, seat racing calculations).

---

## Debugging Guide

### Frontend Debugging

#### React DevTools

Install React DevTools browser extension:
- Chrome: [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React DevTools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

Inspect component state, props, and re-renders.

#### Zustand DevTools

Add Zustand DevTools to any store:

```javascript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      // store definition
    }),
    { name: 'MyStore' }
  )
);
```

View in Redux DevTools extension.

#### Console Logging

**Avoid `console.log` in production code**. Use for development only.

```javascript
// Debug API calls
import axios from 'axios';

axios.interceptors.request.use((config) => {
  console.log('API Request:', config.method.toUpperCase(), config.url);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);
```

#### Vite Source Maps

Source maps are enabled by default in development. Use browser DevTools to set breakpoints in original source files.

---

### Backend Debugging

#### Winston Logging

Backend uses structured logging with Winston.

**Log Levels**: `error`, `warn`, `info`, `debug`

**File**: `server/utils/logger.js`

View logs:
```bash
# Console (development)
npm run server

# Log files (production)
tail -f logs/combined.log
tail -f logs/error.log
```

**Add Debug Logging:**

```javascript
import logger from '../utils/logger.js';

logger.debug('Variable state', { userId, teamId, count: items.length });
logger.info('Operation completed', { duration: Date.now() - start });
logger.warn('Unusual condition', { condition: 'no athletes found' });
logger.error('Operation failed', { error: error.message, stack: error.stack });
```

#### Node.js Debugger

Add `--inspect` flag:

```bash
node --inspect --env-file=.env server/index.js
```

Open `chrome://inspect` in Chrome and click "inspect".

Or use VS Code debugger:

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Server Debug",
      "program": "${workspaceFolder}/server/index.js",
      "envFile": "${workspaceFolder}/.env",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Press F5 to start debugging.

#### Prisma Query Logging

Enable query logging in development:

**File**: `server/db/connection.js`

```javascript
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

**Production**: Use `['error']` only.

---

### Integration Debugging

#### Concept2 Integration

**Common Issues:**

1. **OAuth redirect fails**
   - Ensure `CONCEPT2_REDIRECT_URI` matches exactly in both `.env` and Concept2 developer portal
   - Must be `http://localhost:3001/api/v1/concept2/callback` for local dev

2. **Access token expired**
   - Check token expiry: `await prisma.concept2Auth.findUnique({ where: { userId } })`
   - Tokens expire after 60 days of inactivity
   - Refresh flow: `server/services/concept2Service.js` → `refreshAccessToken()`

3. **Webhook not receiving data**
   - Concept2 webhooks require HTTPS in production
   - Use ngrok for local webhook testing: `ngrok http 3002`
   - Set webhook URL in Concept2 portal: `https://your-ngrok-url.ngrok.io/api/v1/concept2/webhook`

**Debug Endpoint:**

```bash
# Check Concept2 auth status
curl -X GET http://localhost:3002/api/v1/concept2/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Strava Integration

**Common Issues:**

1. **Activity type mismatch**
   - Strava workout types: `Rowing`, `Run`, `Ride`, etc.
   - RowLab maps: `on_water` → `Rowing`, `erg` → `VirtualRow`

2. **Upload rate limit**
   - Strava limits: 100 uploads per 15 minutes, 1000 per day
   - Implement backoff in `server/services/stravaService.js`

3. **FIT file parsing errors**
   - Check FIT file validity: `fitParserService.parseFitFile(buffer)`
   - Common issue: Missing required fields (distance, duration)

**Debug Endpoint:**

```bash
# Check Strava auth status
curl -X GET http://localhost:3002/api/v1/strava/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Common Errors and Solutions

#### 1. `PORT 3002 is already in use`

**Cause**: Backend server already running or port conflict.

**Solution:**

```bash
# Find process using port
lsof -i :3002

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3003
```

#### 2. `Prisma Client Initialization Error`

**Error**: `PrismaClient is unable to run in the browser`

**Cause**: Trying to use Prisma in frontend code.

**Solution**: Never import `@prisma/client` in `src/`. Always use API calls from frontend.

#### 3. `JWT Malformed` or `Invalid Token`

**Cause**: Token format or expiry issue.

**Solution:**

```bash
# Check token in authStore
# Frontend Console:
console.log(useAuthStore.getState().accessToken)

# Backend: Add logging in middleware
logger.debug('Token verification', { token: token.substring(0, 20) + '...' });
```

Clear localStorage:
```javascript
localStorage.clear();
// Refresh page
```

#### 4. `CORS Error` in Browser

**Error**: `Access to fetch at 'http://localhost:3002/api/...' blocked by CORS`

**Cause**: CORS misconfiguration or Vite proxy not working.

**Solution:**

Check Vite proxy in `vite.config.ts`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3002',
    changeOrigin: true,
  },
}
```

Or check CORS middleware in `server/middleware/security.js`.

#### 5. `Database connection failed`

**Error**: `Can't reach database server at localhost:5432`

**Cause**: PostgreSQL not running or wrong credentials.

**Solution:**

```bash
# Check if PostgreSQL is running
pg_isready

# If using Docker:
docker ps | grep postgres

# Start Docker container:
docker start rowlab-postgres

# Test connection:
psql postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev
```

Check `DATABASE_URL` in `.env` matches your PostgreSQL setup.

#### 6. `Erg test not appearing after sync`

**Cause**: Concept2 sync filters or API response format change.

**Debug Steps:**

1. Check Concept2 auth status:
```bash
curl -X GET http://localhost:3002/api/v1/concept2/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. Enable debug logging:
```javascript
// server/services/concept2Service.js
logger.debug('C2 API Response', { data: apiResponse });
```

3. Check database:
```sql
SELECT * FROM workouts WHERE source = 'concept2_sync' ORDER BY created_at DESC LIMIT 10;
```

4. Verify Concept2 API response format matches parser expectations.

#### 7. `Drag-and-Drop not working`

**Cause**: @dnd-kit version mismatch or React 18 concurrent features conflict.

**Solution:**

Check versions:
```bash
npm ls @dnd-kit/core @dnd-kit/sortable
```

Ensure all @dnd-kit packages are compatible versions (see `package.json`).

Clear and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 8. `Memory leak warning` in Development

**Cause**: React Fast Refresh hot-reloading without cleanup.

**Solution**: Ensure cleanup in useEffect hooks:

```javascript
useEffect(() => {
  const interval = setInterval(() => { ... }, 1000);

  // Cleanup function
  return () => clearInterval(interval);
}, []);
```

#### 9. `Build fails with TypeScript errors`

**Solution:**

```bash
# Check types
npm run typecheck

# Fix specific file
npx tsc --noEmit src/path/to/file.tsx
```

Common fixes:
- Add missing type imports
- Use `// @ts-ignore` for third-party library issues (sparingly)
- Ensure `tsconfig.json` includes correct paths

#### 10. `Test failures after database changes`

**Cause**: Stale test data or schema mismatch.

**Solution:**

```bash
# Reset test database
NODE_ENV=test npm run db:reset

# Update Prisma client
npx prisma generate

# Clear test cache
npm run test:run -- --clearCache
```

---

### Performance Debugging

#### Slow API Responses

**Tools:**

1. **Winston Timing Logs:**
```javascript
const start = Date.now();
const result = await someOperation();
logger.info('Operation completed', { duration: Date.now() - start });
```

2. **Prisma Query Logging:**
Enable `log: ['query']` in Prisma client to see SQL queries and duration.

3. **Network Tab:**
Use browser DevTools Network tab to identify slow endpoints.

**Common Optimizations:**

- Add database indexes for frequently queried fields
- Use `select` to limit returned fields
- Batch queries with `Promise.all()`
- Implement pagination for large datasets

#### Slow Frontend Rendering

**Tools:**

1. **React DevTools Profiler:**
   - Record component render times
   - Identify unnecessary re-renders

2. **React.memo():**
```javascript
export default React.memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id; // Return true to skip re-render
});
```

3. **useMemo() and useCallback():**
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

---

## Best Practices

### Code Style

- **ESLint**: Run `npm run lint` before committing
- **Prettier**: Run `npm run format` to auto-format
- **TypeScript**: Prefer `.ts`/`.tsx` for new files

### Security

1. **Never commit `.env` files**
2. **Always hash passwords** with bcrypt (min 10 rounds)
3. **Use parameterized queries** (Prisma does this automatically)
4. **Validate all inputs** with `express-validator`
5. **Rate limit sensitive endpoints** (auth, AI)

### Database

1. **Always use transactions** for multi-step operations
2. **Add indexes** for foreign keys and frequently queried fields
3. **Use migrations** for schema changes (never edit DB directly)
4. **Seed script** should be idempotent

### State Management

1. **Keep stores focused** - one store per domain
2. **Avoid nested state** - flatten where possible
3. **Use computed values** for derived state
4. **Clean up subscriptions** in useEffect

### API Design

1. **RESTful conventions**:
   - `GET` - Read
   - `POST` - Create
   - `PUT/PATCH` - Update
   - `DELETE` - Delete

2. **Consistent response format**:
```javascript
{
  success: true,
  data: { ... },
  error: null
}
```

3. **Error codes**:
   - `400` - Bad Request (validation)
   - `401` - Unauthorized
   - `403` - Forbidden
   - `404` - Not Found
   - `500` - Server Error

4. **Team isolation**: All team data queries must include `teamId` filter

---

## Additional Resources

- [API Documentation](./api/README.md)
- [Database Schema](./database/README.md)
- [Component Documentation](./components/README.md)
- [Production Deployment](./PRODUCTION_READINESS_ROADMAP.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Roadmap](../ROADMAP.md)

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check `docs/` for detailed guides
- **Code Comments**: Most complex logic has inline documentation

---

**Last Updated**: 2025-01-22
**Version**: 2.0
