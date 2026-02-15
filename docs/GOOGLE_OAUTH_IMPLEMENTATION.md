# Google OAuth Implementation Summary

## Overview
This implementation adds Google OAuth authentication to RowLab with invite-only registration validation.

## Key Features

### Security
- ✅ Invite validation required for new users
- ✅ Access and refresh tokens stored in HTTP-only cookies (not in URL)
- ✅ Session secret validation (throws error if not configured)
- ✅ CSRF protection via passport
- ✅ Case-insensitive email matching
- ✅ Environment variable configuration for all sensitive values
- ✅ CodeQL security scan passed with 0 alerts

### Functionality
- ✅ Google OAuth 2.0 integration via passport-google-oauth20
- ✅ Automatic user creation with invite validation
- ✅ Automatic athlete profile linking
- ✅ Team membership creation (ATHLETE role)
- ✅ Supports existing users linking Google accounts
- ✅ Token generation (access + refresh)
- ✅ Proper error handling and logging

## API Endpoints

### GET /api/v1/auth/google
Initiates Google OAuth flow. Redirects user to Google consent screen.

**Query Parameters:**
- `returnTo` (optional) - URL to return to after successful authentication

### GET /api/v1/auth/google/callback
Handles OAuth callback from Google. Validates invitation, creates/links user, sets auth cookies.

**Success:** Redirects to frontend with auth cookies set
**Failure:** Redirects to `/login?error=oauth_failed`

## Environment Variables Required

```bash
# Google OAuth credentials
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3001

# Session secret (REQUIRED)
SESSION_SECRET=generate_secure_random_string
```

## Database Schema Changes

### User Model
- `googleId` (String, unique, optional) - Google OAuth user ID
- `provider` (String, optional) - Auth provider ('local' or 'google')
- `passwordHash` (String, optional) - Only for local auth, null for OAuth

### Migration
Created migration `20260215032608_add_google_oauth_fields` that:
- Adds `googleId` column with unique constraint
- Adds `provider` column
- Makes `passwordHash` nullable

## Code Architecture

### Services
- **googleOAuthService.js**
  - `findOrCreateGoogleUser()` - Shared logic for user lookup/creation
  - `configureGoogleStrategy()` - Passport strategy configuration
  - `handleGoogleOAuth()` - Manual OAuth handling (calls shared logic)
  - `generateOAuthResponse()` - Formats tokens and user data

### Routes (auth.js)
- `GET /google` - Initiates OAuth flow
- `GET /google/callback` - Handles OAuth callback

### Middleware (server/index.js)
- Session middleware for OAuth state management
- Passport initialization

## User Flow

1. User clicks "Sign in with Google" → navigates to `/api/v1/auth/google`
2. Backend redirects to Google consent screen
3. User approves access to email and profile
4. Google redirects to `/api/v1/auth/google/callback` with auth code
5. Backend validates invitation for user's email
6. Backend creates user account or links Google ID to existing account
7. Backend links athlete profile if invitation has athleteId
8. Backend creates team membership
9. Backend marks invitation as claimed
10. Backend generates access and refresh tokens
11. Backend sets tokens as HTTP-only cookies
12. Backend redirects to frontend
13. Frontend reads auth cookies and makes authenticated requests

## Error Handling

### No Valid Invitation
**Error:** "No valid invitation found for this email"
**Cause:** User's email doesn't have a pending, non-expired invitation
**Resolution:** Coach must send invitation first

### No Email in Google Profile
**Error:** "No email found in Google profile"
**Cause:** Google profile doesn't include email (rare)
**Resolution:** User must grant email scope permission

### Session Secret Not Configured
**Error:** "SESSION_SECRET or JWT_SECRET environment variable is required"
**Cause:** Neither SESSION_SECRET nor JWT_SECRET is set
**Resolution:** Add SESSION_SECRET to .env file

## Testing

### Unit Tests
File: `server/tests/googleOAuth.test.js`
- Tests invite validation logic
- Tests OAuth response formatting
- Tests error cases (no email, no invite)

### Manual Testing
1. Set up Google Cloud Console project (see docs/GOOGLE_OAUTH_SETUP.md)
2. Configure environment variables
3. Create invitation for test email
4. Navigate to `/api/v1/auth/google`
5. Complete Google OAuth flow
6. Verify user created and tokens set

## Documentation

- **docs/GOOGLE_OAUTH_SETUP.md** - Step-by-step setup guide for Google Cloud Console
- **.env.example** - Updated with all required OAuth variables
- **Inline code comments** - All functions documented with JSDoc

## Production Considerations

1. Use HTTPS (required by Google for production OAuth)
2. Update GOOGLE_REDIRECT_URI to production domain
3. Update FRONTEND_URL to production domain
4. Add production domain to Google Cloud Console authorized URIs
5. Use strong, unique SESSION_SECRET
6. Enable secure cookies (automatically enabled in NODE_ENV=production)
7. Configure proper CORS for frontend domain
8. Monitor OAuth logs for failed attempts
9. Regularly rotate OAuth credentials

## Security Audit

✅ CodeQL scan: 0 alerts
✅ Code review: All issues addressed
✅ No secrets in code
✅ No hardcoded URLs (all env vars)
✅ Tokens in HTTP-only cookies (not URL)
✅ Session secret validation
✅ Invite validation for new users
✅ CSRF protection via passport
✅ Case-insensitive email matching

## Related Files

- `server/services/googleOAuthService.js` - Core OAuth logic
- `server/routes/auth.js` - OAuth routes
- `server/index.js` - Passport and session config
- `prisma/schema.prisma` - User model changes
- `prisma/migrations/20260215032608_add_google_oauth_fields/` - DB migration
- `.env.example` - Environment variable template
- `docs/GOOGLE_OAUTH_SETUP.md` - Setup documentation
- `server/tests/googleOAuth.test.js` - Unit tests
- `package.json` - New dependencies added

## Dependencies Added

- `passport@0.7.0` - Authentication middleware
- `passport-google-oauth20@2.0.0` - Google OAuth strategy
- `express-session@1.18.1` - Session management for OAuth flow

All dependencies passed GitHub Advisory Database security check.
