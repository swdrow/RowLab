# Athletes API

Manage athlete profiles, including creation, updates, search, and bulk operations.

## Overview

Athletes are individual rower profiles within a team. Athletes can be:
- **Managed**: Created and controlled by coaches (no user account)
- **Linked**: Connected to a user account (athlete can self-manage data)

## Endpoints

### List Athletes

Get all athletes for the active team.

**Endpoint:** `GET /api/v1/athletes`

**Authentication:** Required

**Team Context:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `includeStats` | boolean | Include erg test and workout counts (default: false) |
| `side` | string | Filter by rowing side (Port, Starboard, Cox, Both) |
| `sortBy` | string | Sort field (lastName, firstName, weightKg) |
| `order` | string | Sort order (asc, desc) |
| `limit` | integer | Results per page (max: 100) |
| `offset` | integer | Results to skip |

**Example Request:**
```http
GET /api/v1/athletes?includeStats=true&side=Port
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Smith",
        "fullName": "John Smith",
        "email": "john.smith@example.com",
        "side": "Port",
        "isManaged": false,
        "isLinked": true,
        "weightKg": 85.5,
        "heightCm": 188,
        "concept2UserId": "c2-12345",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z",
        "stats": {
          "ergTestCount": 12,
          "workoutCount": 145
        },
        "latestErgTest": {
          "testType": "2k",
          "timeSeconds": 362.5,
          "testDate": "2025-01-10T00:00:00.000Z"
        }
      }
    ],
    "count": 1
  }
}
```

**Notes:**
- Athletes ordered by last name, then first name
- `includeStats` adds database overhead, use only when needed
- Results automatically filtered to active team

---

### Get Athlete

Retrieve a single athlete by ID with detailed information.

**Endpoint:** `GET /api/v1/athletes/:id`

**Authentication:** Required

**Team Context:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Athlete ID |

**Example Request:**
```http
GET /api/v1/athletes/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Smith",
      "fullName": "John Smith",
      "email": "john.smith@example.com",
      "side": "Port",
      "isManaged": false,
      "isLinked": true,
      "weightKg": 85.5,
      "heightCm": 188,
      "concept2UserId": "c2-12345",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z",
      "stats": {
        "ergTestCount": 12,
        "workoutCount": 145
      },
      "ergTests": [
        {
          "id": "test-uuid-1",
          "testType": "2k",
          "timeSeconds": 362.5,
          "testDate": "2025-01-10T00:00:00.000Z"
        }
      ],
      "ratings": [
        {
          "type": "seat_race_elo",
          "value": 1250.5,
          "confidence": 0.85,
          "racesCount": 8
        }
      ]
    }
  }
}
```

**Errors:**
- `404 Not Found`: Athlete doesn't exist or not in active team

---

### Create Athlete

Create a new managed athlete profile.

**Endpoint:** `POST /api/v1/athletes`

**Authentication:** Required

**Authorization:** OWNER or COACH role

**Team Context:** Required

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "side": "Starboard",
  "weightKg": 72.5,
  "heightCm": 175
}
```

**Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `firstName` | string | Yes | 1-50 characters |
| `lastName` | string | Yes | 1-50 characters |
| `email` | string | No | Valid email format |
| `side` | string | No | Port, Starboard, Both, or Cox |
| `weightKg` | number | No | 30-200 kg |
| `heightCm` | integer | No | 100-250 cm |

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "new-athlete-uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "side": "Starboard",
      "isManaged": true,
      "isLinked": false,
      "weightKg": 72.5,
      "heightCm": 175,
      "concept2UserId": null,
      "createdAt": "2025-01-19T12:00:00.000Z",
      "updatedAt": "2025-01-19T12:00:00.000Z"
    }
  }
}
```

**Errors:**
- `409 Conflict`: Athlete with same first and last name already exists in team
- `400 Bad Request`: Validation error
- `403 Forbidden`: Insufficient permissions (ATHLETE role)

**Notes:**
- Created athlete is managed by default (`isManaged: true`)
- Athlete can later claim profile to link to user account
- Email is optional but required for sending invitations

---

### Update Athlete

Update athlete information.

**Endpoint:** `PATCH /api/v1/athletes/:id`

**Authentication:** Required

**Authorization:** OWNER or COACH role

**Team Context:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Athlete ID |

**Request Body:**
```json
{
  "side": "Both",
  "weightKg": 73.0,
  "email": "new.email@example.com"
}
```

**Updatable Fields:**
- `firstName` (1-50 characters)
- `lastName` (1-50 characters)
- `email` (valid email or null)
- `side` (Port, Starboard, Both, Cox, or null)
- `weightKg` (30-200 or null)
- `heightCm` (100-250 or null)
- `concept2UserId` (string or null)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Jane",
      "lastName": "Doe",
      "side": "Both",
      "weightKg": 73.0,
      "email": "new.email@example.com",
      "updatedAt": "2025-01-19T12:30:00.000Z"
    }
  }
}
```

**Errors:**
- `404 Not Found`: Athlete doesn't exist
- `409 Conflict`: Name change conflicts with existing athlete
- `403 Forbidden`: Insufficient permissions

**Notes:**
- Partial updates supported (only send fields to change)
- Cannot change `userId` or `isManaged` directly (use claim flow)
- Name changes checked for uniqueness within team

---

### Delete Athlete

Delete an athlete profile.

**Endpoint:** `DELETE /api/v1/athletes/:id`

**Authentication:** Required

**Authorization:** OWNER or COACH role

**Team Context:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Athlete ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Athlete deleted"
  }
}
```

**Errors:**
- `404 Not Found`: Athlete doesn't exist
- `400 Bad Request`: Cannot delete linked athlete (has user account)
- `403 Forbidden`: Insufficient permissions

**Cascade Deletes:**
Deleting an athlete also deletes:
- All erg tests
- All workout records
- All lineup assignments
- All seat race assignments
- All telemetry data
- All ratings

**Notes:**
- Cannot delete athletes with linked user accounts (`isLinked: true`)
- Must unlink athlete first, then delete
- Consider archiving instead of deleting for data retention

---

### Search Athletes

Search athletes by name or email.

**Endpoint:** `GET /api/v1/athletes/search`

**Authentication:** Required

**Team Context:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 1 character) |

**Example Request:**
```http
GET /api/v1/athletes/search?q=smith
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "athlete-1",
        "firstName": "John",
        "lastName": "Smith",
        "fullName": "John Smith",
        "email": "john.smith@example.com",
        "side": "Port"
      },
      {
        "id": "athlete-2",
        "firstName": "Sarah",
        "lastName": "Smithson",
        "fullName": "Sarah Smithson",
        "email": "sarah@example.com",
        "side": "Starboard"
      }
    ]
  }
}
```

**Search Behavior:**
- Case-insensitive
- Searches first name, last name, and email
- Returns up to 20 results
- Results ordered by last name, first name

**Notes:**
- Use for autocomplete/typeahead functionality
- Automatically scoped to active team

---

### Get Athletes by Side

Filter athletes by rowing side preference.

**Endpoint:** `GET /api/v1/athletes/by-side/:side`

**Authentication:** Required

**Team Context:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `side` | string | Port, Starboard, or Cox |

**Example Request:**
```http
GET /api/v1/athletes/by-side/Port
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "athlete-1",
        "firstName": "John",
        "lastName": "Smith",
        "side": "Port"
      },
      {
        "id": "athlete-2",
        "firstName": "Alex",
        "lastName": "Johnson",
        "side": "Both"
      }
    ]
  }
}
```

**Notes:**
- Includes athletes with "Both" side for Port and Starboard queries
- Does not include "Both" athletes for Cox queries
- Useful for lineup creation based on boat configuration

---

### Bulk Import Athletes

Create multiple athletes in one request.

**Endpoint:** `POST /api/v1/athletes/bulk-import`

**Authentication:** Required

**Authorization:** OWNER or COACH role

**Team Context:** Required

**Request Body:**
```json
{
  "athletes": [
    {
      "firstName": "Alice",
      "lastName": "Anderson",
      "email": "alice@example.com",
      "side": "Port",
      "weightKg": 70.0
    },
    {
      "firstName": "Bob",
      "lastName": "Brown",
      "side": "Starboard",
      "weightKg": 82.5
    }
  ]
}
```

**Validation:**
- Array must contain 1-100 athletes
- Each athlete follows same validation as create endpoint

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "created": 2,
    "skipped": 0,
    "errors": []
  }
}
```

**Partial Success Response:**
```json
{
  "success": true,
  "data": {
    "created": 1,
    "skipped": 1,
    "errors": [
      {
        "athlete": "Charlie Cooper",
        "error": "Invalid email format"
      }
    ]
  }
}
```

**Notes:**
- Non-atomic operation (partial success possible)
- Duplicates are skipped, not errors
- Validation errors reported per athlete
- Maximum 100 athletes per request
- Consider using CSV import for larger datasets

---

## Data Model

### Athlete Object

```typescript
interface Athlete {
  id: string;                      // UUID
  firstName: string;               // 1-50 characters
  lastName: string;                // 1-50 characters
  fullName: string;                // Computed: firstName + lastName
  email: string | null;            // Valid email or null
  side: 'Port' | 'Starboard' | 'Both' | 'Cox' | null;
  isManaged: boolean;              // true if no user account
  isLinked: boolean;               // true if has user account
  weightKg: number | null;         // 30-200 kg, 2 decimals
  heightCm: number | null;         // 100-250 cm, integer
  concept2UserId: string | null;   // Concept2 ID if linked
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp

  // Optional fields (when includeStats=true)
  stats?: {
    ergTestCount: number;
    workoutCount: number;
  };
  latestErgTest?: {
    testType: string;
    timeSeconds: number;
    testDate: string;
  };
  ratings?: Array<{
    type: string;
    value: number;
    confidence: number;
    racesCount: number;
  }>;
}
```

## Business Rules

### Uniqueness
- Athletes must have unique (firstName, lastName) combinations within a team
- Multiple teams can have athletes with the same name

### Managed vs Linked
- **Managed Athletes**:
  - Created by coaches
  - No user account
  - Can be deleted
  - Coach controls all data

- **Linked Athletes**:
  - Connected to user account
  - Cannot be deleted (only unlinked)
  - Athlete can view own data
  - Coach can still edit profile

### Side Preference
- `Port`: Left side of boat
- `Starboard`: Right side of boat
- `Both`: Can row either side (switch hitter)
- `Cox`: Coxswain (non-rower)
- `null`: Unknown/not set

### Weight & Height
- Optional for basic athlete management
- Important for advanced features (boat balance, speed calculations)
- Can track weight at time of erg test separately

## Use Cases

### Creating Roster
```javascript
// Import athletes from CSV
const athletes = parseCSV(file);
const response = await fetch('/api/v1/athletes/bulk-import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ athletes })
});
```

### Athlete Selection
```javascript
// Get port-side rowers for 8+ lineup
const response = await fetch('/api/v1/athletes/by-side/Port', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const portRowers = await response.json();
```

### Typeahead Search
```javascript
// Search as user types
const response = await fetch(`/api/v1/athletes/search?q=${query}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const results = await response.json();
```

## Related Endpoints

- [Erg Tests API](./erg-tests.md) - Athlete performance data
- [Lineups API](./lineups.md) - Athlete assignments to boats
- [Invitations API](./teams.md#invitations) - Invite athletes to claim profiles

---

**Last Updated**: 2026-01-19
