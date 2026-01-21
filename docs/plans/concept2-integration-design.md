# Concept2 Logbook API Integration Design

## Overview

Integrate Concept2 Logbook API into RowLab to sync athlete erg data automatically. This enables coaches to view official erg test results and athletes to connect their Concept2 accounts.

## API Research Summary

### Endpoints We'll Use

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/oauth/authorize` | GET | Initiate OAuth login |
| `/oauth/access_token` | POST | Exchange code for tokens |
| `/api/users/me` | GET | Get connected user profile |
| `/api/users/{id}/results` | GET | Fetch workout history |
| `/api/users/{id}/results` | POST | Create workout (future) |
| `/api/users/{id}/results/{id}/strokes` | GET | Get stroke-by-stroke data |

### OAuth Scopes Required

```
user:read,user:write,results:read,results:write
```

- `user:read` - Read user profile (name, country, etc.)
- `user:write` - Update user profile (future use)
- `results:read` - Fetch erg test results
- `results:write` - Post results to logbook (future use)

### Environment URLs

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Development | `https://log-dev.concept2.com` | Testing & development |
| Production | `https://log.concept2.com` | Live (requires approval) |

---

## Manual Setup Required

### Step 1: Create Account on Development Server

1. Go to https://log-dev.concept2.com
2. Create a new account (this is separate from production)
3. Log in to access developer portal

### Step 2: Register RowLab Application

Go to: https://log-dev.concept2.com/developers/keys

Enter the following details:

| Field | Value | Explanation |
|-------|-------|-------------|
| **Application Name** | `RowLab` | Your app name shown to users |
| **Description** | `Rowing team management platform for coaches and athletes. Syncs erg data for performance tracking and lineup optimization.` | Shown during OAuth consent |
| **Website URL** | `https://rowlab.net` | Your app's homepage (Cloudflare tunnel) |
| **Redirect URI** | `https://rowlab.net/concept2/callback` | Where users return after auth |
| **Webhook URL** | `https://rowlab.net/api/v1/concept2/webhook` | Real-time result notifications |
| **Logo** | Upload RowLab logo (optional) | Shown on consent screen |

### Webhook Events

The webhook will receive POST requests when:
- `result-added` - New workout logged
- `result-updated` - Workout modified
- `result-deleted` - Workout removed

### Step 3: Save Credentials

After registration, you'll receive:
- **Client ID** - Public identifier (safe to expose in frontend)
- **Client Secret** - Keep this SECRET (server-side only)

Add to your `.env` file:
```bash
# Concept2 API (Development)
CONCEPT2_CLIENT_ID=your_client_id_here
CONCEPT2_CLIENT_SECRET=your_client_secret_here
CONCEPT2_REDIRECT_URI=https://rowlab.net/concept2/callback
CONCEPT2_WEBHOOK_URL=https://rowlab.net/api/v1/concept2/webhook
CONCEPT2_API_URL=https://log-dev.concept2.com
```

---

## Architecture Design

### Database Schema Additions

```prisma
model Concept2Connection {
  id            String   @id @default(cuid())

  // Link to RowLab athlete
  athleteId     String   @unique
  athlete       Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  // Concept2 user info
  concept2UserId Int
  username       String?

  // OAuth tokens (encrypted)
  accessToken   String
  refreshToken  String
  tokenExpiry   DateTime

  // Sync metadata
  lastSyncAt    DateTime?
  syncEnabled   Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ErgResult {
  id            String   @id @default(cuid())

  athleteId     String
  athlete       Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  // Concept2 result ID for deduplication
  concept2Id    Int?     @unique

  // Result data
  date          DateTime
  distance      Int      // meters
  time          Int      // tenths of seconds
  type          String   // rower, skierg, bike
  workoutType   String   // JustRow, FixedDistanceSplits, etc.

  // Performance metrics
  avgPace       Int?     // tenths of seconds per 500m
  avgSPM        Int?     // strokes per minute
  avgWatts      Int?
  avgHeartRate  Int?
  maxHeartRate  Int?
  calories      Int?
  dragFactor    Int?

  // Verification
  verified      Boolean  @default(false)
  source        String   // "concept2", "manual"

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([athleteId, date])
}
```

### Backend Routes

```
POST   /api/v1/concept2/connect      - Start OAuth flow
GET    /api/v1/concept2/callback     - OAuth callback handler
GET    /concept2/callback            - Frontend callback page route
DELETE /api/v1/concept2/disconnect   - Remove connection
POST   /api/v1/concept2/sync         - Manual sync trigger
GET    /api/v1/concept2/status       - Connection status
GET    /api/v1/concept2/results      - Get synced results
POST   /api/v1/concept2/webhook      - Webhook receiver (from Concept2)
```

### Webhook Payload Structure

```json
{
  "event": "result-added",
  "user_id": 12345,
  "result_id": 67890,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

When webhook received:
1. Verify request signature (if provided)
2. Look up athlete by `concept2UserId`
3. Fetch full result details from API
4. Upsert into `ErgResult` table
5. Return 200 OK

### Service Layer

```
server/services/concept2Service.js
├── generateAuthUrl()         - Create OAuth authorization URL
├── exchangeCodeForTokens()   - Exchange auth code for tokens
├── refreshAccessToken()      - Refresh expired tokens
├── fetchUserProfile()        - Get C2 user info
├── fetchResults()            - Get workout history
├── syncAthleteResults()      - Full sync for an athlete
└── createResult()            - Post result to C2 (future)
```

### Frontend Components

```
src/components/Concept2/
├── Concept2ConnectButton.jsx   - "Connect Concept2" button
├── Concept2Status.jsx          - Connection status indicator
├── Concept2SyncPanel.jsx       - Sync controls and status
└── Concept2ResultsTable.jsx    - Display synced results

src/pages/Concept2CallbackPage.jsx  - OAuth callback handler
```

---

## OAuth Flow Sequence

```
┌─────────┐     ┌─────────┐     ┌──────────────┐
│ Browser │     │ RowLab  │     │  Concept2    │
│         │     │ Server  │     │  log-dev     │
└────┬────┘     └────┬────┘     └──────┬───────┘
     │               │                  │
     │ Click Connect │                  │
     ├──────────────>│                  │
     │               │                  │
     │  Redirect to C2 authorize        │
     │<──────────────┤                  │
     │               │                  │
     │ User logs in & approves          │
     ├─────────────────────────────────>│
     │               │                  │
     │ Redirect with ?code=xxx          │
     │<─────────────────────────────────┤
     │               │                  │
     │ Send code to server              │
     ├──────────────>│                  │
     │               │ Exchange code    │
     │               ├─────────────────>│
     │               │                  │
     │               │ Access + Refresh │
     │               │<─────────────────┤
     │               │                  │
     │               │ Fetch user profile
     │               ├─────────────────>│
     │               │                  │
     │               │ User data        │
     │               │<─────────────────┤
     │               │                  │
     │ Success!      │                  │
     │<──────────────┤                  │
     │               │                  │
```

---

## TDD Implementation Plan

### Phase 1: Core OAuth (Tests First)

```javascript
// tests/concept2/oauth.test.js
describe('Concept2 OAuth', () => {
  test('generates valid authorization URL with all params')
  test('exchanges auth code for tokens')
  test('refreshes expired access token')
  test('handles invalid/expired refresh token')
  test('stores tokens securely in database')
})
```

### Phase 2: Data Sync (Tests First)

```javascript
// tests/concept2/sync.test.js
describe('Concept2 Sync', () => {
  test('fetches user profile after connection')
  test('fetches paginated results')
  test('deduplicates results by concept2Id')
  test('converts C2 time format to standard')
  test('handles API rate limits gracefully')
  test('retries on temporary failures')
})
```

### Phase 3: Frontend Integration

```javascript
// tests/concept2/ui.test.jsx
describe('Concept2 UI', () => {
  test('shows connect button when not connected')
  test('shows status when connected')
  test('handles OAuth callback correctly')
  test('displays sync progress')
  test('shows synced results in table')
})
```

---

## Security Considerations

1. **Token Storage**: Encrypt access/refresh tokens at rest
2. **Client Secret**: Never expose in frontend, server-only
3. **HTTPS Only**: All API calls must use HTTPS
4. **Token Refresh**: Implement proactive refresh before expiry
5. **Scope Limitation**: Request only needed scopes
6. **State Parameter**: Use CSRF protection in OAuth flow

---

## Implementation Order

1. Database migrations (Concept2Connection, ErgResult)
2. Backend OAuth service with tests
3. Backend API routes with tests
4. Frontend callback page
5. Frontend connect/status components
6. Sync functionality
7. Results display in athlete profile
8. Background sync job (optional)

---

## Production Deployment

When ready for production:

1. Email `ranking@concept2.com` requesting production access
2. Include: app description, expected user count, OAuth flow demo
3. Wait for approval
4. Update environment variables:
   ```bash
   CONCEPT2_API_URL=https://log.concept2.com
   CONCEPT2_CLIENT_ID=production_id
   CONCEPT2_CLIENT_SECRET=production_secret
   CONCEPT2_REDIRECT_URI=https://rowlab.app/concept2/callback
   ```

---

## Sources

- [Concept2 Logbook API Documentation](https://log.concept2.com/developers/documentation/)
- [Concept2 Developer Portal](https://log.concept2.com/developers/home)
- [Development Server](https://log-dev.concept2.com/developers/home)
