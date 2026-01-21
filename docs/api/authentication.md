# Authentication API

RowLab uses JWT-based authentication with access and refresh tokens. All authenticated requests require a valid JWT access token.

## Authentication Flow

```
1. User registers or logs in
2. Server validates credentials
3. Server generates:
   - Access token (JWT, 15 min expiry)
   - Refresh token (secure cookie, 7 day expiry)
4. Client stores access token (memory/localStorage)
5. Client includes token in Authorization header
6. When access token expires, use refresh token to get new access token
```

## Token Format

### Access Token (JWT)
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "activeTeamId": "team-uuid",
  "activeTeamRole": "COACH",
  "iat": 1640995200,
  "exp": 1640996100
}
```

### Refresh Token
- Stored as HTTP-only cookie
- 7-day expiration
- Includes family ID for rotation detection
- Automatically rotated on each use

## Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/v1/auth/register`

**Rate Limit:** 5 requests/minute

**Request:**
```json
{
  "email": "coach@example.com",
  "password": "SecurePassword123!",
  "name": "John Smith"
}
```

**Validation:**
- `email`: Valid email format, unique
- `password`: Minimum 8 characters
- `name`: Required, non-empty string

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "coach@example.com",
      "name": "John Smith"
    }
  }
}
```

**Errors:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

---

### Login

Authenticate and receive access + refresh tokens.

**Endpoint:** `POST /api/v1/auth/login`

**Rate Limit:** 5 requests/minute

**Request:**
```json
{
  "email": "coach@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "coach@example.com",
      "name": "John Smith"
    },
    "teams": [
      {
        "id": "team-uuid-1",
        "name": "University Rowing Club",
        "slug": "university-rowing",
        "role": "COACH"
      },
      {
        "id": "team-uuid-2",
        "name": "Elite Training Center",
        "slug": "elite-training",
        "role": "OWNER"
      }
    ],
    "activeTeamId": "team-uuid-1",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Headers:**
```http
Set-Cookie: refreshToken=<secure_token>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account suspended
- `400 Bad Request`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

---

### Refresh Access Token

Exchange refresh token for new access token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Rate Limit:** None (uses refresh token)

**Request:**
No body required. Refresh token sent automatically via cookie.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Headers:**
```http
Set-Cookie: refreshToken=<new_secure_token>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Errors:**
- `401 Unauthorized`: Invalid, expired, or missing refresh token
- `500 Internal Server Error`: Token refresh failed

**Token Rotation:**
Each refresh generates a new refresh token and revokes the old one. This prevents token replay attacks.

---

### Logout

Revoke refresh tokens and clear cookie.

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required

**Request:** No body

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Response Headers:**
```http
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

**Errors:**
- `401 Unauthorized`: Invalid or missing access token
- `500 Internal Server Error`: Logout failed

---

### Get Current User

Retrieve current user information and team memberships.

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "coach@example.com",
      "name": "John Smith",
      "teams": [
        {
          "id": "team-uuid-1",
          "name": "University Rowing Club",
          "slug": "university-rowing",
          "role": "COACH"
        },
        {
          "id": "team-uuid-2",
          "name": "Elite Training Center",
          "slug": "elite-training",
          "role": "OWNER"
        }
      ]
    }
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid or missing access token
- `500 Internal Server Error`: Failed to retrieve user

---

### Switch Active Team

Change the active team context.

**Endpoint:** `POST /api/v1/auth/switch-team`

**Authentication:** Required

**Request:**
```json
{
  "teamId": "team-uuid-2"
}
```

**Validation:**
- `teamId`: Valid UUID, user must be a member

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "team": {
      "id": "team-uuid-2",
      "name": "Elite Training Center",
      "slug": "elite-training",
      "role": "OWNER"
    }
  }
}
```

**Notes:**
- Returns a new access token with updated team context
- Previous access token becomes invalid
- Client must replace stored access token

**Errors:**
- `403 Forbidden`: Not a member of the team
- `400 Bad Request`: Invalid team ID
- `401 Unauthorized`: Invalid or missing access token

---

## Authentication Middleware

### `authenticateToken`
Verifies JWT and attaches user to request.

**Usage in Routes:**
```javascript
router.get('/protected', authenticateToken, (req, res) => {
  // req.user contains:
  // { id, email, activeTeamId, activeTeamRole }
});
```

**Response on Failure:**
```json
{
  "success": false,
  "error": {
    "code": "NO_TOKEN",
    "message": "Authentication required"
  }
}
```

### `requireRole(...roles)`
Ensures user has one of the specified roles in active team.

**Usage:**
```javascript
router.post(
  '/athletes',
  authenticateToken,
  requireRole('OWNER', 'COACH'),
  createAthlete
);
```

**Roles:**
- `OWNER`: Full administrative access
- `COACH`: Manage athletes and data
- `ATHLETE`: Limited read access

**Response on Failure:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### `teamIsolation`
Ensures request has active team context.

**Usage:**
```javascript
router.use(authenticateToken, teamIsolation);
```

Attaches `req.teamFilter = { teamId: req.user.activeTeamId }` for database queries.

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (12 salt rounds)
- Never transmitted in GET requests
- Never logged or stored in plaintext

### Token Security
- **Access Token**:
  - Short-lived (15 minutes)
  - Stored in memory or localStorage
  - Included in Authorization header
  - Not transmitted in URLs

- **Refresh Token**:
  - Long-lived (7 days)
  - HTTP-only cookie (not accessible via JavaScript)
  - Secure flag in production (HTTPS only)
  - SameSite=Lax (CSRF protection)
  - Automatically rotated on use

### Token Rotation
Refresh tokens use a "family ID" for rotation detection:
1. Each refresh generates new token with same family ID
2. Old token is revoked
3. If revoked token is reused, entire family is revoked
4. Prevents token replay attacks

### HTTPS Requirement
- Production requires HTTPS for all requests
- Cookies marked `Secure` in production
- Access tokens never sent over unencrypted connections

### Rate Limiting
- Auth endpoints: 5 requests/minute per IP
- Prevents brute force attacks
- 429 status code with Retry-After header

### Account Suspension
Admins can suspend accounts:
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_SUSPENDED",
    "message": "Account is suspended"
  }
}
```

---

## Client Implementation

### JavaScript/TypeScript Example

```javascript
class AuthClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
      return data.data;
    }

    throw new Error(data.error.message);
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include' // Send refresh token cookie
    });

    const data = await response.json();

    if (data.success) {
      this.accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
      return this.accessToken;
    }

    // Refresh failed, redirect to login
    this.logout();
    throw new Error('Session expired');
  }

  async fetchWithAuth(url, options = {}) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`
    };

    let response = await fetch(url, options);

    // Auto-refresh on 401
    if (response.status === 401) {
      await this.refreshToken();
      options.headers.Authorization = `Bearer ${this.accessToken}`;
      response = await fetch(url, options);
    }

    return response;
  }

  async logout() {
    await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }
}
```

---

## Testing Authentication

### Register Test User
```bash
curl -X POST http://localhost:3002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Use Access Token
```bash
TOKEN="<access_token_from_login>"

curl -X GET http://localhost:3002/api/v1/athletes \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3002/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

---

**Last Updated**: 2026-01-19
