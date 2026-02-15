# RowLab Backend API Documentation

**Version**: v1
**Base URL**: `http://localhost:8000/api/v1` (development) | `https://your-domain.com/api/v1` (production)
**Authentication**: JWT Bearer Token (except where noted)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Core Resources](#core-resources)
   - [Teams](#teams)
   - [Athletes](#athletes)
   - [Erg Tests & Workouts](#erg-tests--workouts)
5. [Training](#training)
   - [Training Plans](#training-plans)
   - [Calendar Events](#calendar-events)
   - [Water Sessions](#water-sessions)
6. [Competition](#competition)
   - [Lineups](#lineups)
   - [Seat Races](#seat-races)
   - [Regattas](#regattas)
7. [Integrations](#integrations)
   - [Concept2](#concept2)
   - [Strava](#strava)
8. [Features](#features)
   - [AI Lineup Optimizer](#ai-lineup-optimizer)
   - [Rankings & ELO](#rankings--elo)
9. [Administration](#administration)
   - [Subscriptions](#subscriptions)
   - [Settings](#settings)
10. [Middleware & Security](#middleware--security)

---

## Overview

RowLab is a multi-tenant rowing team management platform with team-based data isolation. All authenticated endpoints (except where noted) require:

1. **Authentication**: JWT access token in `Authorization: Bearer <token>` header
2. **Team Context**: Active team ID embedded in JWT (switched via `/auth/switch-team`)
3. **Team Isolation**: All queries are automatically scoped to the user's active team

### Architecture Patterns

- **Multi-tenant**: Team-based data isolation via `teamId` foreign keys
- **Role-based Access Control (RBAC)**: Roles: `OWNER`, `COACH`, `COXSWAIN`, `ATHLETE`
- **JWT Authentication**: Access tokens (15min) + refresh tokens (7d) stored in HTTP-only cookies
- **Rate Limiting**: Global (100 req/min), Auth (5 req/min), AI (20 req/min)
- **Security Headers**: Helmet.js with CSP, HSTS, XSS protection

### Database

- **PostgreSQL** with Prisma ORM
- **Schema**: See `/home/swd/RowLab/prisma/schema.prisma`
- **Encryption**: OAuth tokens encrypted at rest using AES-256-GCM

---

## Authentication

### Register New User

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "coach@example.com",
  "password": "securePassword123",
  "name": "John Smith"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "coach@example.com",
      "name": "John Smith"
    }
  }
}
```

**Errors**:
- `409 EMAIL_EXISTS`: Email already registered
- `400 VALIDATION_ERROR`: Invalid input (password < 8 chars, invalid email)
- `429 RATE_LIMITED`: Too many attempts (5/minute)

---

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "coach@example.com",  // or "username" for admin accounts
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "coach@example.com",
      "name": "John Smith",
      "isAdmin": false
    },
    "teams": [
      {
        "id": "team-uuid",
        "name": "Varsity Rowing",
        "slug": "varsity-rowing",
        "role": "OWNER"
      }
    ],
    "activeTeamId": "team-uuid",
    "accessToken": "eyJhbGc..."
  }
}
```

**Set-Cookie**: `refreshToken` (HTTP-only, 7 days)

**Errors**:
- `401 INVALID_CREDENTIALS`: Wrong email/password
- `403 ACCOUNT_SUSPENDED`: Account suspended
- `429 RATE_LIMITED`: Too many attempts

---

### Refresh Access Token

```http
POST /api/v1/auth/refresh
Cookie: refreshToken=...
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

**Errors**:
- `401 NO_REFRESH_TOKEN`: No refresh token provided
- `401 INVALID_REFRESH_TOKEN`: Token expired or revoked

---

### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Switch Active Team

```http
POST /api/v1/auth/switch-team
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "teamId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",  // New token with updated team context
    "team": {
      "id": "uuid",
      "name": "JV Rowing",
      "slug": "jv-rowing",
      "role": "COACH"
    }
  }
}
```

**Errors**:
- `403 NOT_MEMBER`: User not a member of this team

---

### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "coach@example.com",
      "name": "John Smith",
      "isAdmin": false,
      "teams": [
        {
          "id": "uuid",
          "name": "Varsity Rowing",
          "slug": "varsity-rowing",
          "role": "OWNER"
        }
      ]
    }
  }
}
```

---

## Error Handling

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ]  // Optional validation errors
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `NO_TOKEN` | 401 | No authentication token provided |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `NO_TEAM` | 400 | No active team selected |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Core Resources

## Teams

### Create Team

```http
POST /api/v1/teams
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "University Rowing Team",
  "isPublic": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "name": "University Rowing Team",
      "slug": "university-rowing-team",
      "inviteCode": "ABC12345",
      "isPublic": false,
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

---

### Get Team Details

```http
GET /api/v1/teams/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "name": "University Rowing Team",
      "slug": "university-rowing-team",
      "inviteCode": "ABC12345",
      "isPublic": false,
      "visibilitySetting": "coaches_only",
      "settings": {
        "athletesCanSeeRankings": true,
        "athletesCanSeeOthersErgData": false
      }
    }
  }
}
```

**Errors**:
- `403 FORBIDDEN`: Not a member of this team
- `404 NOT_FOUND`: Team not found

---

### Update Team Settings

**Requires**: `OWNER` role

```http
PATCH /api/v1/teams/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all optional):
```json
{
  "name": "Updated Name",
  "isPublic": true,
  "visibilitySetting": "open"  // "open" | "coaches_only" | "opt_in"
}
```

**Response** (200): Same as Get Team Details

**Errors**:
- `403 FORBIDDEN`: Only team owner can update settings

---

### Get Team Members

```http
GET /api/v1/teams/:id/members
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "userId": "uuid",
        "role": "OWNER",
        "user": {
          "name": "John Smith",
          "email": "john@example.com"
        },
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### Update Member Role

**Requires**: `OWNER` role

```http
PATCH /api/v1/teams/:id/members/:userId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "COACH"  // "OWNER" | "COACH" | "COXSWAIN" | "ATHLETE"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "uuid",
      "userId": "uuid",
      "role": "COACH"
    }
  }
}
```

**Errors**:
- `403 FORBIDDEN`: Only owner can change roles

---

### Remove Member

**Requires**: `OWNER` role

```http
DELETE /api/v1/teams/:id/members/:userId
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Member removed"
  }
}
```

**Errors**:
- `403 FORBIDDEN`: Cannot remove owner or insufficient permissions

---

### Join Team by Invite Code

```http
POST /api/v1/teams/join/:code
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "name": "University Rowing Team",
      "slug": "university-rowing-team"
    }
  }
}
```

**Errors**:
- `404 INVALID_CODE`: Invalid invite code
- `409 ALREADY_MEMBER`: Already a member of this team

---

### Regenerate Invite Code

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/teams/:id/regenerate-code
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "inviteCode": "XYZ98765"
  }
}
```

---

### Search Public Teams

```http
GET /api/v1/teams/search?q=university
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "uuid",
        "name": "University Rowing Team",
        "slug": "university-rowing-team",
        "isPublic": true
      }
    ]
  }
}
```

---

## Athletes

### Create Athlete

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/athletes
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",  // Optional
  "side": "Port",  // "Port" | "Starboard" | "Both" | "Cox"
  "weightKg": 68.5,  // Optional
  "heightCm": 175  // Optional
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "side": "Port",
      "weightKg": 68.5,
      "heightCm": 175,
      "isManaged": true,
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

**Errors**:
- `409 DUPLICATE`: Athlete with same name already exists
- `403 LIMIT_REACHED`: Athlete limit reached for current plan

---

### Get All Athletes

```http
GET /api/v1/athletes?includeStats=true
Authorization: Bearer <token>
```

**Query Parameters**:
- `includeStats` (boolean): Include erg test stats and ratings

**Response** (200):
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Doe",
        "side": "Port",
        "weightKg": 68.5,
        "heightCm": 175,
        "ergTestCount": 5,
        "best2k": 420.5,
        "combinedRating": 1250.5
      }
    ],
    "count": 25
  }
}
```

---

### Get Athlete by ID

```http
GET /api/v1/athletes/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "side": "Port",
      "weightKg": 68.5,
      "heightCm": 175,
      "isManaged": true
    }
  }
}
```

**Errors**:
- `404 NOT_FOUND`: Athlete not found

---

### Get Current User's Athlete Profile

```http
GET /api/v1/athletes/me?ergPage=1&ergLimit=20&includeAllHistory=false
Authorization: Bearer <token>
```

**Query Parameters**:
- `ergPage` (number): Page number for erg tests (default: 1)
- `ergLimit` (number): Tests per page (max: 100, default: 10)
- `includeAllHistory` (boolean): Include all erg tests (ignores pagination)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "athlete": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "side": "Port",
      "weightKg": 68.5,
      "heightCm": 175
    },
    "ergTests": [
      {
        "id": "uuid",
        "testType": "2k",
        "testDate": "2025-01-15T00:00:00Z",
        "distanceM": 2000,
        "timeSeconds": 420.5,
        "splitSeconds": 105.1,
        "watts": 250,
        "strokeRate": 32
      }
    ],
    "ergTestPagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    },
    "lineups": [
      {
        "id": "uuid",
        "name": "Varsity 8+",
        "boatClass": "8+",
        "seatNumber": 5,
        "isCoxswain": false
      }
    ],
    "myRanking": {
      "rank": 3,
      "totalAthletes": 25,
      "score": 1250.5,
      "confidence": 0.85,
      "racesCount": 12
    },
    "teamVisibility": {
      "athletesCanSeeRankings": true,
      "athletesCanSeeOthersErgData": false,
      "athletesCanSeeOthersLineups": true
    },
    "concept2Status": {
      "connected": true,
      "username": "jane_rower",
      "lastSyncedAt": "2025-01-22T08:00:00Z",
      "syncEnabled": true
    }
  }
}
```

**Errors**:
- `404 NOT_FOUND`: No athlete profile found for this user

---

### Get Athlete Dashboard (Coach View)

**Requires**: `OWNER` or `COACH` role

```http
GET /api/v1/athletes/:id/dashboard?ergPage=1&ergLimit=20
Authorization: Bearer <token>
```

**Response** (200): Same structure as `/athletes/me` but for any athlete

---

### Update Athlete

**Requires**: `OWNER` or `COACH` role

```http
PATCH /api/v1/athletes/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all optional):
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "side": "Starboard",
  "weightKg": 69.0,
  "heightCm": 176
}
```

**Response** (200): Same as Get Athlete by ID

**Errors**:
- `404 NOT_FOUND`: Athlete not found
- `409 DUPLICATE`: Athlete with new name already exists

---

### Delete Athlete

**Requires**: `OWNER` or `COACH` role

```http
DELETE /api/v1/athletes/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Athlete deleted"
  }
}
```

**Errors**:
- `404 NOT_FOUND`: Athlete not found
- `400 LINKED_ACCOUNT`: Cannot delete athlete with linked user account

---

### Bulk Import Athletes

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/athletes/bulk-import
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "athletes": [
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "side": "Port"
    },
    {
      "firstName": "John",
      "lastName": "Smith",
      "side": "Starboard"
    }
  ]
}
```

**Response** (200):
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

---

### Search Athletes

```http
GET /api/v1/athletes/search?q=Jane
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "athletes": [
      {
        "id": "uuid",
        "firstName": "Jane",
        "lastName": "Doe",
        "side": "Port"
      }
    ]
  }
}
```

---

### Get Athletes by Side

```http
GET /api/v1/athletes/by-side/:side
Authorization: Bearer <token>
```

**Path Parameters**:
- `side`: "Port" | "Starboard" | "Cox"

**Response** (200): Same as Get All Athletes

---

## Erg Tests & Workouts

### Create Erg Test

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/erg-tests
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "athleteId": "uuid",
  "testType": "2k",  // "2k" | "6k" | "30min" | "500m"
  "testDate": "2025-01-22T10:00:00Z",
  "distanceM": 2000,
  "timeSeconds": 420.5,
  "watts": 250,
  "strokeRate": 32,
  "weightKg": 68.5,  // Optional
  "notes": "Good performance"  // Optional
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "ergTest": {
      "id": "uuid",
      "athleteId": "uuid",
      "testType": "2k",
      "testDate": "2025-01-22T10:00:00Z",
      "distanceM": 2000,
      "timeSeconds": 420.5,
      "splitSeconds": 105.1,
      "watts": 250,
      "strokeRate": 32,
      "weightKg": 68.5,
      "notes": "Good performance"
    }
  }
}
```

---

### Get Workouts

```http
GET /api/v1/workouts?athleteId=uuid&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

**Query Parameters**:
- `athleteId` (uuid): Filter by athlete
- `startDate` (ISO 8601): Filter start date
- `endDate` (ISO 8601): Filter end date
- `source` (string): Filter by source (e.g., "concept2_sync", "strava_sync")

**Response** (200):
```json
{
  "success": true,
  "data": {
    "workouts": [
      {
        "id": "uuid",
        "athleteId": "uuid",
        "source": "concept2_sync",
        "type": "erg",
        "date": "2025-01-22T10:00:00Z",
        "distanceM": 5000,
        "durationSeconds": 1200.5,
        "strokeRate": 24,
        "calories": 450
      }
    ]
  }
}
```

---

## Training

## Training Plans

### Create Training Plan

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/training-plans
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Spring 2025 Base Phase",
  "description": "8-week base building program",
  "startDate": "2025-01-20T00:00:00Z",
  "endDate": "2025-03-15T00:00:00Z",
  "phase": "Base",  // "Base" | "Build" | "Peak" | "Taper" | "Recovery"
  "isTemplate": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "uuid",
      "name": "Spring 2025 Base Phase",
      "description": "8-week base building program",
      "teamId": "uuid",
      "createdBy": "uuid",
      "startDate": "2025-01-20T00:00:00Z",
      "endDate": "2025-03-15T00:00:00Z",
      "phase": "Base",
      "isTemplate": false,
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

---

### List Training Plans

```http
GET /api/v1/training-plans?isTemplate=false&phase=Base&limit=50
Authorization: Bearer <token>
```

**Query Parameters**:
- `isTemplate` (boolean): Filter templates
- `phase` (string): Filter by phase
- `limit` (number): Max results (1-200)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "uuid",
        "name": "Spring 2025 Base Phase",
        "phase": "Base",
        "startDate": "2025-01-20T00:00:00Z",
        "endDate": "2025-03-15T00:00:00Z",
        "workoutCount": 24,
        "assignedAthletes": 15
      }
    ]
  }
}
```

---

### Get Training Plan by ID

```http
GET /api/v1/training-plans/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "uuid",
      "name": "Spring 2025 Base Phase",
      "description": "8-week base building program",
      "phase": "Base",
      "startDate": "2025-01-20T00:00:00Z",
      "endDate": "2025-03-15T00:00:00Z",
      "workouts": [
        {
          "id": "uuid",
          "name": "Monday Steady State",
          "type": "erg",
          "scheduledDate": "2025-01-20T06:00:00Z",
          "duration": 3600,
          "distance": 10000,
          "targetPace": 120.0,
          "intensity": "easy",
          "description": "10k @ 2:00/500m"
        }
      ],
      "assignments": [
        {
          "id": "uuid",
          "athleteId": "uuid",
          "athleteName": "Jane Doe",
          "startDate": "2025-01-20T00:00:00Z",
          "status": "active"
        }
      ]
    }
  }
}
```

---

### Update Training Plan

**Requires**: `OWNER` or `COACH` role

```http
PUT /api/v1/training-plans/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all optional):
```json
{
  "name": "Updated Plan Name",
  "description": "New description",
  "startDate": "2025-01-21T00:00:00Z",
  "endDate": "2025-03-16T00:00:00Z",
  "phase": "Build"
}
```

**Response** (200): Same as Get Training Plan by ID

---

### Delete Training Plan

**Requires**: `OWNER` or `COACH` role

```http
DELETE /api/v1/training-plans/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Training plan deleted"
  }
}
```

---

### Add Workout to Plan

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/training-plans/:id/workouts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Monday Steady State",
  "type": "erg",  // "erg" | "row" | "cross_train" | "strength" | "rest"
  "description": "10k @ 2:00/500m",
  "scheduledDate": "2025-01-20T06:00:00Z",
  "duration": 3600,  // seconds
  "distance": 10000,  // meters
  "targetPace": 120.0,  // seconds per 500m
  "targetHeartRate": 145,
  "intensity": "easy",  // "easy" | "moderate" | "hard" | "max"
  "order": 1
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "workout": {
      "id": "uuid",
      "planId": "uuid",
      "name": "Monday Steady State",
      "type": "erg",
      "scheduledDate": "2025-01-20T06:00:00Z",
      "duration": 3600,
      "distance": 10000,
      "targetPace": 120.0,
      "intensity": "easy"
    }
  }
}
```

---

### Update Planned Workout

**Requires**: `OWNER` or `COACH` role

```http
PUT /api/v1/training-plans/:id/workouts/:workoutId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**: Same as Add Workout (all fields optional)

**Response** (200): Same as Add Workout

---

### Delete Planned Workout

**Requires**: `OWNER` or `COACH` role

```http
DELETE /api/v1/training-plans/:id/workouts/:workoutId
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Planned workout deleted"
  }
}
```

---

### Assign Plan to Athletes

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/training-plans/:id/assign
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "athleteIds": ["uuid1", "uuid2", "uuid3"],
  "startDate": "2025-01-20T00:00:00Z",
  "endDate": "2025-03-15T00:00:00Z"  // Optional
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "uuid",
        "planId": "uuid",
        "athleteId": "uuid1",
        "startDate": "2025-01-20T00:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

---

### Remove Assignment

**Requires**: `OWNER` or `COACH` role

```http
DELETE /api/v1/training-plans/:id/assignments/:assignmentId
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Assignment removed"
  }
}
```

---

### Get Athlete's Plans

```http
GET /api/v1/training-plans/athlete/:athleteId
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "uuid",
        "name": "Spring 2025 Base Phase",
        "phase": "Base",
        "startDate": "2025-01-20T00:00:00Z",
        "endDate": "2025-03-15T00:00:00Z",
        "assignmentStatus": "active",
        "compliance": 0.87,
        "completedWorkouts": 15,
        "totalWorkouts": 24
      }
    ]
  }
}
```

---

### Get Training Load

```http
GET /api/v1/training-plans/athlete/:athleteId/load?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "load": {
      "totalDistance": 150000,
      "totalDuration": 36000,
      "workoutCount": 20,
      "averageIntensity": "moderate",
      "weeklyLoad": [
        {
          "week": "2025-01-20",
          "distance": 50000,
          "duration": 12000
        }
      ]
    }
  }
}
```

---

### Record Workout Completion

```http
POST /api/v1/training-plans/:id/workouts/:workoutId/complete
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "athleteId": "uuid",
  "workoutId": "uuid",  // Optional: Link to actual Workout record
  "compliance": 0.95,  // 0-1: How well targets were met
  "notes": "Felt strong today"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "completion": {
      "id": "uuid",
      "plannedWorkoutId": "uuid",
      "athleteId": "uuid",
      "completedAt": "2025-01-22T10:00:00Z",
      "compliance": 0.95,
      "notes": "Felt strong today"
    }
  }
}
```

---

### Get Templates

```http
GET /api/v1/training-plans/templates
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "8_week_base",
        "name": "8-Week Base Building",
        "description": "Foundation aerobic development",
        "phase": "Base",
        "durationWeeks": 8,
        "workoutsPerWeek": 6
      }
    ]
  }
}
```

---

### Create Plan from Template

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/training-plans/from-template
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "templateId": "8_week_base",
  "name": "Spring 2025 Base Phase",  // Optional
  "startDate": "2025-01-20T00:00:00Z"  // Optional
}
```

**Response** (201): Same as Create Training Plan

---

## Competition

## Lineups

### Create Lineup

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/lineups
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Varsity 8+ A",
  "notes": "Competition lineup",
  "assignments": [
    {
      "athleteId": "uuid",
      "boatClass": "8+",
      "seatNumber": 1,
      "side": "Port",
      "isCoxswain": false
    },
    {
      "athleteId": "uuid2",
      "boatClass": "8+",
      "seatNumber": 9,
      "side": "Cox",
      "isCoxswain": true
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "lineup": {
      "id": "uuid",
      "name": "Varsity 8+ A",
      "notes": "Competition lineup",
      "assignments": [
        {
          "id": "uuid",
          "athleteId": "uuid",
          "athlete": {
            "firstName": "Jane",
            "lastName": "Doe"
          },
          "boatClass": "8+",
          "seatNumber": 1,
          "side": "Port",
          "isCoxswain": false
        }
      ],
      "createdAt": "2025-01-22T10:00:00Z"
    }
  }
}
```

---

## Seat Races

### Create Seat Race Session

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/seat-races
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "date": "2025-01-22T10:00:00Z",
  "location": "Home course",
  "conditions": "calm",  // "calm" | "variable" | "rough"
  "boatClass": "8+",
  "description": "Final selection seat race",
  "pieces": [
    {
      "sequenceOrder": 1,
      "distanceMeters": 2000,
      "direction": "downstream",
      "boats": [
        {
          "name": "Boat A",
          "shellName": "Hudson A",
          "finishTimeSeconds": 360.5,
          "handicapSeconds": 0,
          "assignments": [
            {
              "athleteId": "uuid",
              "seatNumber": 5,
              "side": "Port"
            }
          ]
        }
      ]
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "date": "2025-01-22T10:00:00Z",
      "location": "Home course",
      "conditions": "calm",
      "boatClass": "8+",
      "pieces": [
        {
          "id": "uuid",
          "sequenceOrder": 1,
          "distanceMeters": 2000,
          "boats": [
            {
              "id": "uuid",
              "name": "Boat A",
              "finishTimeSeconds": 360.5,
              "margin": "+2.3s"
            }
          ]
        }
      ]
    }
  }
}
```

---

## Regattas

### Create Regatta

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/regattas
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Spring Regatta 2025",
  "location": "Boston, MA",
  "date": "2025-04-15T00:00:00Z",
  "courseType": "2000m",  // "2000m" | "1500m" | "head"
  "conditions": {
    "wind": "light",
    "temperature": 65,
    "current": "minimal"
  },
  "description": "Annual spring championship"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "regatta": {
      "id": "uuid",
      "name": "Spring Regatta 2025",
      "location": "Boston, MA",
      "date": "2025-04-15T00:00:00Z",
      "courseType": "2000m",
      "conditions": {
        "wind": "light",
        "temperature": 65,
        "current": "minimal"
      }
    }
  }
}
```

---

## Integrations

## Concept2

### OAuth Flow

#### 1. Get Authorization URL

```http
POST /api/v1/concept2/connect
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "url": "https://log-dev.concept2.com/oauth/authorize?client_id=...",
    "state": "base64_encoded_state"
  }
}
```

**Usage**: Redirect user to `url` in popup window

---

#### 2. OAuth Callback

```http
GET /api/v1/concept2/callback?code=AUTH_CODE&state=STATE
```

**Note**: No authentication required (called by Concept2). Returns HTML that:
- Validates HMAC signature (if webhook secret configured)
- Exchanges code for tokens
- Stores encrypted tokens in database
- Sends `postMessage` to opener window with result

**Response**: HTML page with success/error message

---

### Get Connection Status

```http
GET /api/v1/concept2/status/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "connected": true,
    "username": "jane_rower",
    "c2UserId": "12345",
    "lastSyncedAt": "2025-01-22T08:00:00Z",
    "syncEnabled": true,
    "tokenExpiresAt": "2025-02-22T10:00:00Z"
  }
}
```

---

### Sync Workouts

```http
POST /api/v1/concept2/sync/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "syncedCount": 15,
    "skippedCount": 2,
    "newWorkouts": [
      {
        "id": "uuid",
        "date": "2025-01-22T10:00:00Z",
        "distanceM": 5000,
        "durationSeconds": 1200.5
      }
    ]
  }
}
```

**Errors**:
- `404 NOT_CONNECTED`: No Concept2 connection found
- `404 NO_ATHLETE_PROFILE`: User has no athlete profile

---

### Disconnect

```http
DELETE /api/v1/concept2/disconnect/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Concept2 disconnected"
  }
}
```

---

### Webhook Handler

```http
POST /api/v1/concept2/webhook
Content-Type: application/json
X-Concept2-Signature: hmac_signature
```

**Note**: No authentication required. Validates HMAC signature with `CONCEPT2_WEBHOOK_SECRET`.

**Request Body**:
```json
{
  "type": "result.created",
  "timestamp": "2025-01-22T10:00:00Z",
  "userId": "12345",
  "data": {
    "resultId": "67890",
    "distance": 5000,
    "time": 1200.5
  }
}
```

**Response** (200):
```json
{
  "received": true
}
```

**Security**:
- Validates HMAC signature
- Checks timestamp to prevent replay attacks (5 minute window)
- Always returns 200 to prevent retries

---

## Strava

### OAuth Flow

#### 1. Get Authorization URL

```http
GET /api/v1/strava/auth-url
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "authUrl": "https://www.strava.com/oauth/authorize?client_id=..."
  }
}
```

---

#### 2. OAuth Callback

```http
GET /api/v1/strava/callback?code=AUTH_CODE&state=STATE
```

**Note**: No authentication required. Redirects to settings page with success/error message.

---

### Get Connection Status

```http
GET /api/v1/strava/status/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "connected": true,
    "username": "jane_athlete",
    "stravaAthleteId": 123456,
    "lastSyncedAt": "2025-01-22T08:00:00Z",
    "syncEnabled": true,
    "scope": "activity:read,activity:write"
  }
}
```

---

### Sync Activities from Strava

```http
POST /api/v1/strava/sync/me
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "after": "2025-01-01T00:00:00Z"  // Optional: Sync activities after this date
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "syncedCount": 10,
    "skippedCount": 5,
    "newWorkouts": [
      {
        "id": "uuid",
        "date": "2025-01-22T10:00:00Z",
        "type": "row",
        "distanceM": 8000
      }
    ]
  }
}
```

---

### Get Strava Activities (Read-only)

```http
GET /api/v1/strava/activities?page=1&perPage=30&after=2025-01-01T00:00:00Z
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `perPage` (number): Activities per page (default: 30)
- `after` (ISO 8601): Filter activities after date
- `before` (ISO 8601): Filter activities before date

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 123456,
      "name": "Morning Row",
      "type": "Rowing",
      "distance": 8000,
      "moving_time": 1800,
      "start_date": "2025-01-22T10:00:00Z",
      "average_heartrate": 145
    }
  ]
}
```

---

### Concept2 to Strava Sync Configuration

#### Get C2 to Strava Config

```http
GET /api/v1/strava/c2-sync/config
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "types": {
      "rower": true,
      "bikeerg": true,
      "skierg": false
    },
    "lastSyncedAt": "2025-01-22T08:00:00Z",
    "availableTypes": {
      "rower": "Rowing (Concept2)",
      "bikeerg": "BikeErg",
      "skierg": "SkiErg"
    }
  }
}
```

---

#### Update C2 to Strava Config

```http
PATCH /api/v1/strava/c2-sync/config
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "enabled": true,
  "types": {
    "rower": true,
    "bikeerg": false,
    "skierg": false
  }
}
```

**Response** (200): Same as Get Config

---

#### Trigger C2 to Strava Sync

```http
POST /api/v1/strava/c2-sync/trigger
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "after": "2025-01-01T00:00:00Z"  // Optional
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "uploaded": 5,
    "skipped": 2,
    "failed": 0,
    "activities": [
      {
        "c2WorkoutId": "uuid",
        "stravaActivityId": 123456,
        "name": "5000m Erg",
        "uploadedAt": "2025-01-22T10:00:00Z"
      }
    ]
  }
}
```

---

### Disconnect Strava

```http
DELETE /api/v1/strava/disconnect/me
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Strava disconnected"
  }
}
```

---

## Features

## AI Lineup Optimizer

### Optimize Lineup

**Requires**: `OWNER` or `COACH` role

```http
POST /api/v1/ai-lineup/optimize
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "boatClass": "8+",
  "athleteIds": ["uuid1", "uuid2", "uuid3"],  // Optional: Pre-select athletes
  "constraints": {
    "requiredPairs": [
      {"athleteId1": "uuid1", "athleteId2": "uuid2"}
    ],
    "preferPort": ["uuid3"],
    "preferStarboard": ["uuid4"]
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "lineup": [
      {
        "seatNumber": 1,
        "athleteId": "uuid",
        "athleteName": "Jane Doe",
        "side": "Port",
        "rating": 1250.5,
        "reasoning": "Strong technical scores, port preference"
      }
    ],
    "predictedSpeed": 6.42,
    "confidence": 0.85,
    "alternatives": [
      {
        "seatNumber": 5,
        "athleteId": "uuid2",
        "athleteName": "John Smith",
        "reasoning": "Similar rating, could swap"
      }
    ]
  }
}
```

---

## Rankings & ELO

### Get Team Rankings

```http
GET /api/v1/rankings?ratingType=combined&limit=50
Authorization: Bearer <token>
```

**Query Parameters**:
- `ratingType` (string): "seat_race_elo" | "combined" (default: "combined")
- `limit` (number): Max results (default: 50)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "athleteId": "uuid",
        "firstName": "Jane",
        "lastName": "Doe",
        "ratingValue": 1450.5,
        "confidenceScore": 0.92,
        "racesCount": 15,
        "lastCalculatedAt": "2025-01-22T10:00:00Z"
      }
    ]
  }
}
```

---

## Administration

## Subscriptions

### Get Subscription

```http
GET /api/v1/subscriptions
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "teamId": "uuid",
      "plan": "pro",  // "free" | "starter" | "pro" | "enterprise"
      "status": "active",
      "athleteLimit": 50,
      "coachLimit": 5,
      "currentPeriodStart": "2025-01-01T00:00:00Z",
      "currentPeriodEnd": "2025-02-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "features": [
        "ai_lineup",
        "training_plans",
        "seat_racing",
        "integrations"
      ]
    }
  }
}
```

---

### Create Checkout Session

**Requires**: `OWNER` role

```http
POST /api/v1/subscriptions/checkout
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "plan": "pro",  // "starter" | "pro" | "enterprise"
  "successUrl": "https://app.rowlab.com/settings?success=true",
  "cancelUrl": "https://app.rowlab.com/settings?canceled=true"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sessionId": "stripe_session_id",
    "url": "https://checkout.stripe.com/..."
  }
}
```

---

### Stripe Webhook Handler

```http
POST /api/v1/subscriptions/webhook
Content-Type: application/json
Stripe-Signature: signature
```

**Note**: No authentication required. Validates Stripe signature.

**Supported Events**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Settings

### Get User Settings

```http
GET /api/v1/settings
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "settings": {
      "emailNotifications": true,
      "pushNotifications": false,
      "darkMode": true,
      "compactView": false,
      "autoSave": true,
      "firstName": "Jane",
      "lastName": "Doe",
      "avatar": "data:image/png;base64,..."
    }
  }
}
```

---

### Update User Settings

```http
PATCH /api/v1/settings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all optional):
```json
{
  "emailNotifications": false,
  "darkMode": true,
  "firstName": "Jane",
  "avatar": "data:image/png;base64,..."
}
```

**Response** (200): Same as Get Settings

---

## Middleware & Security

### Authentication Middleware

**`authenticateToken`**: Verify JWT and attach `req.user`

```javascript
req.user = {
  id: "uuid",
  email: "user@example.com",
  activeTeamId: "team-uuid",
  activeTeamRole: "COACH"
}
```

**`optionalAuth`**: Sets `req.user` if token valid, continues otherwise

**`requireRole(...roles)`**: Require specific roles (OWNER, COACH, ATHLETE, COXSWAIN)

**`requireTeam`**: Require active team context

**`teamIsolation`**: Attach `req.teamFilter = { teamId: activeTeamId }` for queries

---

### Rate Limiting

| Limiter | Window | Max Requests |
|---------|--------|--------------|
| Global | 1 minute | 100 |
| Auth | 1 minute | 5 |
| AI | 1 minute | 20 |
| API | 1 minute | 60 |

**Response** (429):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many attempts, try again later"
  }
}
```

---

### Subscription Limits

**`checkAthleteLimit`**: Verify team can add athletes

**`checkCoachLimit`**: Verify team can add coaches

**`requireFeature(feature)`**: Check if feature available on plan

**`attachSubscription`**: Attach `req.subscription` for downstream use

**Features by Plan**:

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| Athletes | 15 | 50 | 200 | Unlimited |
| Coaches | 1 | 3 | 10 | Unlimited |
| AI Lineup | ✗ | ✗ | ✓ | ✓ |
| Training Plans | ✗ | ✓ | ✓ | ✓ |
| Seat Racing | ✓ | ✓ | ✓ | ✓ |
| Integrations | ✗ | ✓ | ✓ | ✓ |
| API Access | ✗ | ✗ | ✓ | ✓ |

---

### Security Headers

**Helmet.js Configuration**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

**CORS**:
- Origin: `process.env.CLIENT_URL` (whitelist)
- Credentials: true (for cookies)
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## Database Models

See `/home/swd/RowLab/prisma/schema.prisma` for complete schema.

**Core Models**:
- `User`: User accounts
- `Team`: Team/organization
- `TeamMember`: Team membership (many-to-many with roles)
- `Athlete`: Athlete profiles (managed or user-linked)
- `ErgTest`: Erg test results
- `Workout`: Training workouts (synced or manual)
- `Lineup`: Boat lineups with seat assignments
- `SeatRaceSession`: Seat racing data
- `Regatta`: Regatta events
- `TrainingPlan`: Periodized training programs
- `Concept2Auth`: Encrypted OAuth tokens
- `StravaAuth`: Encrypted OAuth tokens
- `Subscription`: Team subscription/billing

**Key Indexes**:
- `teamId` on all team-scoped tables
- `userId` on user-scoped tables
- `c2LogbookId`, `stravaActivityId` (unique) for deduplication

---

## Services

**Business Logic Layer** (in `/home/swd/RowLab/server/services/`)

### Core Services

- **`authService.js`**: User registration, login, JWT generation, password hashing (bcrypt)
- **`tokenService.js`**: JWT access/refresh tokens, token rotation, revocation
- **`athleteService.js`**: Athlete CRUD, bulk import, search
- **`teamService.js`**: Team management, membership, invite codes
- **`ergTestService.js`**: Erg test CRUD, statistics
- **`workoutService.js`**: Workout CRUD, bulk creation, filtering
- **`trainingPlanService.js`**: Training plans, periodization, assignment, compliance
- **`lineupService.js`**: Lineup creation, optimization, seat assignments
- **`seatRaceService.js`**: Seat race sessions, ELO calculations
- **`regattaService.js`**: Regatta and race result management

### Integration Services

- **`concept2Service.js`**: OAuth flow, token storage (encrypted), workout sync, webhook handler
- **`stravaService.js`**: OAuth flow, activity sync, C2→Strava upload
- **`fitParserService.js`**: Parse FIT files from Garmin/Wahoo/SpeedCoach
- **`backgroundSyncService.js`**: Cron jobs for auto-sync (Concept2, Strava)

### Analytics Services

- **`eloRatingService.js`**: ELO rating calculations for seat racing
- **`combinedScoringService.js`**: Multi-factor athlete rankings
- **`racePredictorService.js`**: Race time prediction models
- **`aiLineupOptimizerService.js`**: AI-powered lineup optimization

### Infrastructure Services

- **`stripeService.js`**: Subscription management, Stripe integration
- **`inviteService.js`**: Email invitations for athletes
- **`announcementService.js`**: Team announcements
- **`telemetryService.js`**: Oarlock sensor data processing

---

## External OAuth Integrations

### Concept2 Logbook

**OAuth 2.0 Flow**:
1. User clicks "Connect Concept2" → `GET /api/v1/concept2/connect`
2. Backend generates auth URL with state parameter
3. User redirects to Concept2 OAuth page
4. User authorizes → Concept2 redirects to `/api/v1/concept2/callback?code=...&state=...`
5. Backend exchanges code for tokens
6. Backend encrypts and stores tokens in `Concept2Auth` table
7. Returns HTML that sends `postMessage` to opener window

**Token Storage**:
- Access tokens encrypted with AES-256-GCM
- Refresh tokens encrypted separately
- Tokens auto-refresh before expiration

**Webhook Integration**:
- Concept2 sends `POST /api/v1/concept2/webhook` on new result
- Validates HMAC signature with `CONCEPT2_WEBHOOK_SECRET`
- Checks timestamp to prevent replay attacks (5 min window)
- Auto-syncs new workouts to athlete profile

**Environment Variables**:
```bash
CONCEPT2_CLIENT_ID=your_client_id
CONCEPT2_CLIENT_SECRET=your_client_secret
CONCEPT2_REDIRECT_URI=http://localhost:8000/api/v1/concept2/callback
CONCEPT2_API_URL=https://log-dev.concept2.com  # or https://log.concept2.com
CONCEPT2_WEBHOOK_SECRET=your_webhook_secret
```

---

### Strava

**OAuth 2.0 Flow**:
1. User clicks "Connect Strava" → `GET /api/v1/strava/auth-url`
2. Backend generates Strava OAuth URL
3. User authorizes → Strava redirects to `/api/v1/strava/callback?code=...`
4. Backend exchanges code for tokens (includes athlete ID and scopes)
5. Backend encrypts and stores tokens in `StravaAuth` table
6. Redirects user to settings page with success message

**Bidirectional Sync**:
- **Strava → RowLab**: Sync rowing activities to Workout table
- **Concept2 → Strava**: Upload C2 workouts to Strava as activities

**Token Storage**:
- Access tokens encrypted (AES-256-GCM)
- Refresh tokens encrypted
- Tokens auto-refresh before expiration

**Environment Variables**:
```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:8000/api/v1/strava/callback
```

---

## Background Jobs

**Service**: `backgroundSyncService.js`

**Jobs** (run every 30 minutes in production):

1. **Concept2 Auto-Sync**:
   - Finds all users with `syncEnabled: true`
   - Checks for new workouts since `lastSyncedAt`
   - Imports new workouts to athlete profiles
   - Updates `lastSyncedAt` timestamp

2. **Strava Auto-Sync**:
   - Finds all users with Strava `syncEnabled: true`
   - Syncs recent rowing activities
   - Deduplicates by `stravaActivityId`

3. **C2 to Strava Upload**:
   - Finds users with `c2ToStravaEnabled: true`
   - Checks for new C2 workouts since `lastC2SyncedAt`
   - Uploads matching workout types to Strava
   - Respects user's type filters (rower, bikeerg, skierg)

**Start on Server Boot**:
```javascript
if (NODE_ENV === 'production') {
  startBackgroundSync();
}
```

---

## Health & Monitoring

### Health Check

```http
GET /api/health
GET /api/v1/health
```

**No authentication required** (for Docker/k8s)

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-22T10:00:00Z",
  "database": "connected",
  "uptime": 3600
}
```

---

### Admin Storage Info

**Requires**: Admin account

```http
GET /api/admin/storage
Authorization: Bearer <admin_token>
```

**Response** (200):
```json
{
  "totalSize": 1024000000,
  "freeSpace": 512000000,
  "usage": {
    "database": 256000000,
    "uploads": 128000000,
    "logs": 64000000
  }
}
```

---

## Development & Testing

### Local Development

**Start Backend**:
```bash
cd /home/swd/RowLab/server
npm run dev  # Runs on port 8000
```

**Environment Variables** (`.env`):
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/rowlab
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=your-32-byte-hex-key

CONCEPT2_CLIENT_ID=...
CONCEPT2_CLIENT_SECRET=...
CONCEPT2_REDIRECT_URI=http://localhost:8000/api/v1/concept2/callback
CONCEPT2_WEBHOOK_SECRET=...

STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NODE_ENV=development
```

---

### Testing

**Run Tests**:
```bash
npm test
```

**Test Files** (in `/home/swd/RowLab/server/tests/`):
- `authService.test.js`
- `athleteService.test.js`
- `concept2Service.test.js`
- `stravaService.test.js`
- `trainingPlanService.test.js`
- `ergTestService.test.js`
- `backgroundSyncService.test.js`
- `encryption.test.js`
- `fitParserService.test.js`

---

### API Testing with cURL

**Register**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Login**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

**Get Athletes** (with auth):
```bash
curl http://localhost:8000/api/v1/athletes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Version History

**v1.0** (Current):
- Multi-tenant team management
- JWT authentication with refresh tokens
- Athlete & erg test management
- Training plans (Phase 6)
- Concept2 OAuth integration
- Strava OAuth integration
- Seat racing with ELO ratings
- AI lineup optimizer
- Subscription management (Stripe)
- Background sync jobs
- Rate limiting & security headers

---

## Support & Contact

**Documentation**: `/home/swd/RowLab/docs/`
**Issues**: GitHub Issues
**API Version**: v1 (stable)

---

**Last Updated**: 2025-01-22
**Maintainer**: RowLab Development Team
