# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for RowLab.

## Prerequisites

- A Google Cloud Console account
- RowLab backend running (default: http://localhost:8000 or port 3002)
- RowLab frontend running (default: http://localhost:3001)

## Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later reference

## Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (or Internal if you're using Google Workspace)
3. Fill in the required information:
   - **App name**: RowLab
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application** as the application type
4. Configure:
   - **Name**: RowLab OAuth Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3001` (for development)
     - Your production domain (e.g., `https://rowlab.example.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/v1/auth/google/callback` (development)
     - Your production callback URL (e.g., `https://rowlab.example.com/api/v1/auth/google/callback`)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret** — you'll need these for your `.env` file

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3001

# Session secret (required for OAuth state management)
SESSION_SECRET=generate_a_secure_random_string_here
```

For production, update `GOOGLE_REDIRECT_URI` and `FRONTEND_URL` to your production domain.

**Important Security Notes:**
- `SESSION_SECRET` is required. If not set, the server will fail to start.
- Never use the same secret in production as in development
- Generate secure random strings with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Step 5: Restart the Server

Restart your RowLab backend server to load the new environment variables:

```bash
npm run server
```

You should see a log message confirming Google OAuth is configured:
```
Google OAuth configured
```

## Step 6: Test the Integration

### Backend Routes

The following routes are now available:

- **GET `/api/v1/auth/google`** — Initiates Google OAuth flow, redirects to Google consent screen
- **GET `/api/v1/auth/google/callback`** — Handles the OAuth callback after user grants consent

### Invite-Only Registration

**Important:** Google OAuth in RowLab requires invite-only registration. Users must have a valid, unexpired invitation to their email address before they can sign in with Google.

To test:

1. Create a team and an athlete profile
2. Send an invitation to the athlete's email address
3. The athlete can then use Google OAuth to sign in with that email
4. The system will:
   - Verify the invitation exists and is valid
   - Create a user account linked to the Google ID
   - Link the athlete profile to the user account
   - Create team membership with ATHLETE role
   - Mark the invitation as claimed

### Frontend Integration

The frontend should navigate users to `/api/v1/auth/google` when they click "Sign in with Google".

Example button handler:
```javascript
const handleGoogleSignIn = () => {
  window.location.href = '/api/v1/auth/google';
};
```

After successful authentication, users will be redirected back to the frontend with:
- Access token set as an HTTP-only cookie (15 minutes expiry)
- Refresh token set as an HTTP-only cookie (7 days expiry)

The frontend should read the access token from cookies and use it for API requests.

## Troubleshooting

### "Google OAuth not configured" Warning

This means the `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` environment variables are missing. Double-check your `.env` file and restart the server.

### "No valid invitation found for this email"

The user's email doesn't have a pending invitation. Create an invitation first:
1. Log in as a coach or admin
2. Go to team settings
3. Create an athlete profile
4. Send an invitation to the athlete's email

### Redirect URI Mismatch

If you see this error from Google, verify:
- The redirect URI in your `.env` matches exactly what's configured in Google Cloud Console
- You've added all necessary URIs (development and production)
- There are no typos or trailing slashes

### OAuth Flow Returns to Login with Error

Check the backend logs for detailed error messages. Common issues:
- Database connection problems
- Missing or expired invitations
- Email mismatch between invitation and Google account

## Security Considerations

1. **Keep credentials secret**: Never commit `.env` files to version control
2. **Use HTTPS in production**: Google requires HTTPS for production OAuth redirect URIs
3. **Rotate secrets regularly**: Periodically regenerate OAuth credentials in Google Cloud Console
4. **Validate invitations**: The system automatically validates that invitations are:
   - Still pending (not already claimed)
   - Not expired
   - Match the email from the Google profile

## Database Schema

The Google OAuth integration adds the following fields to the `User` model:

- `googleId` (String, unique, optional) — Google OAuth ID
- `provider` (String, optional) — Authentication provider ('local' or 'google')
- `passwordHash` (String, optional) — Only required for local auth, not OAuth

Users created via Google OAuth:
- Have `provider = 'google'`
- Have `googleId` set to their Google user ID
- Have `passwordHash = null` (OAuth users don't need passwords)
- Can still set a password later if needed for local authentication

## Production Deployment

For production:

1. Add your production domain to the OAuth consent screen
2. Add your production redirect URI to the authorized redirect URIs
3. Update your `.env` or environment variable configuration:
   ```bash
   GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback
   ```
4. Ensure your reverse proxy (nginx, etc.) properly forwards OAuth requests
5. Use HTTPS — OAuth will not work over HTTP in production

## Support

For issues specific to Google OAuth configuration, refer to:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Help](https://cloud.google.com/docs)

For issues with RowLab integration, check:
- Backend logs: `npm run server`
- Database state: `npm run db:studio`
- Server tests: `npm run test -- googleOAuth.test.js`
