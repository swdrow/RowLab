# API Documentation

RowLab provides a RESTful API with versioned endpoints, comprehensive authentication, and team-based data isolation.

## Base URL

```
Development: http://localhost:3002/api/v1
Production: https://your-domain.com/api/v1
```

## API Versioning

RowLab uses URL-based versioning:
- **v1 (current)**: `/api/v1/*` - Multi-tenant architecture with team isolation
- **Legacy**: `/api/*` - Legacy endpoints (deprecated, use v1)

## Authentication

All API requests (except authentication endpoints) require a JWT access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: Short-lived (15 minutes), contains user ID, team ID, and role
- **Refresh Token**: Long-lived (7 days), HTTP-only cookie for token rotation

See [Authentication Documentation](./authentication.md) for detailed auth flow.

## Request Headers

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Optional Headers
```http
X-Team-ID: <team_uuid>  # Override active team (if user is member)
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "resource": { ... },
    "count": 10,
    "metadata": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [...]  # Only for validation errors
  }
}
```

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Authentication required or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE` | Resource already exists |
| `FORBIDDEN` | Insufficient permissions |
| `NO_TOKEN` | Missing authentication token |
| `INVALID_TOKEN` | Invalid or expired token |
| `INVALID_CREDENTIALS` | Wrong email or password |
| `ACCOUNT_SUSPENDED` | User account suspended |
| `NO_TEAM` | No active team selected |
| `NOT_MEMBER` | User not a member of team |
| `LINKED_ACCOUNT` | Cannot delete linked athlete |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting

RowLab implements rate limiting to protect API resources:

- **Global**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per minute
- **AI endpoints**: 20 requests per minute
- **Standard API**: 60 requests per minute

Rate limit headers in response:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination via query parameters:

```http
GET /api/v1/athletes?limit=20&offset=0
```

**Parameters:**
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "athletes": [...],
    "count": 20,
    "total": 150,
    "hasMore": true
  }
}
```

## Filtering & Sorting

### Filtering
Many endpoints support filtering via query parameters:

```http
GET /api/v1/athletes?side=Port&includeStats=true
GET /api/v1/erg-tests?testType=2k&fromDate=2025-01-01
```

### Sorting
Use `sortBy` and `order` parameters:

```http
GET /api/v1/athletes?sortBy=lastName&order=asc
```

## Field Selection

Use `fields` parameter to limit returned fields:

```http
GET /api/v1/athletes?fields=id,firstName,lastName
```

## Batch Operations

Bulk operations are available for certain resources:

```http
POST /api/v1/athletes/bulk-import
POST /api/v1/erg-tests/bulk-import
```

**Request:**
```json
{
  "athletes": [
    { "firstName": "John", "lastName": "Smith", "side": "Port" },
    { "firstName": "Jane", "lastName": "Doe", "side": "Starboard" }
  ]
}
```

**Response:**
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

## Validation

Request validation uses express-validator. Validation errors return:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "notanemail"
      }
    ]
  }
}
```

## CORS Policy

The API supports Cross-Origin Resource Sharing (CORS):

**Allowed Origins:**
- Development: `http://localhost:3001`, `http://localhost:3000`
- Production: Configured domain

**Allowed Methods:**
- GET, POST, PATCH, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Team-ID

## Security

### HTTPS
Production API requires HTTPS for all requests.

### Security Headers
All responses include security headers:
- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: XSS filter

### Request Size Limits
- JSON body: 10MB max
- File uploads: Configured per endpoint

## Health Check

```http
GET /api/health
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "environment": "production"
}
```

## API Endpoints Reference

### Authentication
- [POST /auth/register](./authentication.md#register)
- [POST /auth/login](./authentication.md#login)
- [POST /auth/refresh](./authentication.md#refresh-token)
- [POST /auth/logout](./authentication.md#logout)
- [GET /auth/me](./authentication.md#get-current-user)
- [POST /auth/switch-team](./authentication.md#switch-team)

### Athletes
- [GET /athletes](./athletes.md#list-athletes)
- [POST /athletes](./athletes.md#create-athlete)
- [GET /athletes/:id](./athletes.md#get-athlete)
- [PATCH /athletes/:id](./athletes.md#update-athlete)
- [DELETE /athletes/:id](./athletes.md#delete-athlete)
- [GET /athletes/search](./athletes.md#search-athletes)
- [POST /athletes/bulk-import](./athletes.md#bulk-import)

### Erg Tests
- [GET /erg-tests](./erg-tests.md#list-tests)
- [POST /erg-tests](./erg-tests.md#create-test)
- [GET /erg-tests/:id](./erg-tests.md#get-test)
- [PATCH /erg-tests/:id](./erg-tests.md#update-test)
- [DELETE /erg-tests/:id](./erg-tests.md#delete-test)
- [GET /erg-tests/leaderboard](./erg-tests.md#leaderboard)
- [POST /erg-tests/bulk-import](./erg-tests.md#bulk-import)

### Lineups
- [GET /lineups](./lineups.md#list-lineups)
- [POST /lineups](./lineups.md#create-lineup)
- [GET /lineups/:id](./lineups.md#get-lineup)
- [PATCH /lineups/:id](./lineups.md#update-lineup)
- [DELETE /lineups/:id](./lineups.md#delete-lineup)
- [POST /lineups/:id/duplicate](./lineups.md#duplicate-lineup)
- [GET /lineups/:id/export](./lineups.md#export-lineup)

### Seat Racing
- [GET /seat-races](./seat-racing.md#list-sessions)
- [POST /seat-races](./seat-racing.md#create-session)
- [GET /seat-races/:id](./seat-racing.md#get-session)
- [PATCH /seat-races/:id](./seat-racing.md#update-session)
- [DELETE /seat-races/:id](./seat-racing.md#delete-session)
- [POST /seat-races/:id/pieces](./seat-racing.md#add-piece)
- [POST /seat-races/:id/calculate](./seat-racing.md#calculate-results)

### Regattas & Racing
- [GET /regattas](./racing.md#list-regattas)
- [POST /regattas](./racing.md#create-regatta)
- [GET /regattas/:id](./racing.md#get-regatta)
- [POST /regattas/:id/races](./racing.md#add-race)
- [POST /races/:id/results](./racing.md#add-result)

### Teams
- [GET /teams](./teams.md#list-teams)
- [POST /teams](./teams.md#create-team)
- [GET /teams/:id](./teams.md#get-team)
- [PATCH /teams/:id](./teams.md#update-team)
- [POST /teams/:id/invitations](./teams.md#create-invitation)

## SDK & Client Libraries

### JavaScript/TypeScript
```javascript
import { RowLabClient } from '@rowlab/client';

const client = new RowLabClient({
  baseURL: 'https://api.rowlab.com',
  token: 'your_access_token'
});

const athletes = await client.athletes.list();
```

### Python (Coming Soon)
```python
from rowlab import RowLabClient

client = RowLabClient(token='your_access_token')
athletes = client.athletes.list()
```

## Webhooks

RowLab supports webhooks for real-time event notifications:

- `athlete.created`
- `athlete.updated`
- `erg_test.created`
- `lineup.created`
- `seat_race.completed`

See [Webhooks Documentation](./webhooks.md) for details.

## API Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and breaking changes.

## Support

- **Issues**: GitHub Issues
- **Email**: support@rowlab.com
- **Docs**: https://docs.rowlab.com

---

**API Version**: v1.0.0
**Last Updated**: 2026-01-19
