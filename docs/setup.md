# RowLab Developer Setup Guide

Complete guide for setting up RowLab in a local development environment.

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Installation |
|----------|----------------|--------------|
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org) or `nvm install 18` |
| **npm** | 9.0.0+ | Comes with Node.js |
| **PostgreSQL** | 14.0+ | [postgresql.org](https://postgresql.org) or Docker |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |

### Optional Software

| Software | Purpose | Installation |
|----------|---------|--------------|
| **Ollama** | Local AI for lineup optimization | [ollama.ai](https://ollama.ai) |
| **Docker** | PostgreSQL container | [docker.com](https://docker.com) |
| **tmux** | Persistent dev sessions | `apt install tmux` or `brew install tmux` |

### Check Versions

```bash
node --version   # Should be v18.0.0 or higher
npm --version    # Should be 9.0.0 or higher
psql --version   # Should be 14.x or higher
git --version    # Should be 2.30 or higher
```

---

## Installation Steps

### 1. Clone the Repository

```bash
# SSH (recommended)
git clone git@github.com:samwduncan/RowLab.git
cd RowLab

# HTTPS
git clone https://github.com/samwduncan/RowLab.git
cd RowLab
```

### 2. Install Dependencies

```bash
npm install
```

This installs all frontend and backend dependencies (~500MB).

**Note:** If you encounter peer dependency warnings, these are generally safe to ignore.

### 3. Set Up PostgreSQL

#### Option A: Docker (Recommended)

```bash
docker run -d \
  --name rowlab-postgres \
  -e POSTGRES_USER=rowlab \
  -e POSTGRES_PASSWORD=rowlab_dev \
  -e POSTGRES_DB=rowlab_dev \
  -p 5432:5432 \
  postgres:14-alpine
```

**Verify it's running:**
```bash
docker ps | grep rowlab-postgres
```

**Connection string:**
```
postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev
```

#### Option B: Local PostgreSQL Installation

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**On macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Create database:**
```bash
sudo -u postgres psql
```

```sql
CREATE USER rowlab WITH PASSWORD 'rowlab_dev';
CREATE DATABASE rowlab_dev OWNER rowlab;
GRANT ALL PRIVILEGES ON DATABASE rowlab_dev TO rowlab;
\q
```

**Test connection:**
```bash
psql postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database - PostgreSQL connection
DATABASE_URL="postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev"

# Authentication (REQUIRED)
JWT_SECRET="generate-a-secure-random-string-here"
JWT_REFRESH_SECRET="generate-another-secure-random-string-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Encryption (REQUIRED for production)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-64-character-hex-string-here"

# Server
PORT=8000
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

#### Generate Secure Secrets

**JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Example output: xK3p9Vn2Q8mL5hT1wR7yU0zA4sD6fG9jH2kP8mN5vB4=
```

**Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example output: 3f2a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a
```

Copy these values into your `.env` file.

### 5. Initialize the Database

#### Run Migrations

Apply the database schema:

```bash
npx prisma migrate dev
```

This creates all tables, indexes, and constraints defined in `prisma/schema.prisma`.

**Expected output:**
```
✔ Generated Prisma Client
✔ Migrations applied successfully
```

#### Generate Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript types for database access.

#### Seed the Database

Create initial admin user and test data:

```bash
npm run db:seed
```

**Default Credentials:**
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change these credentials immediately in production!

The seed script also creates:
- Sample team ("Demo Rowing Club")
- 8 test athletes
- Sample erg tests
- Basic boat configurations

### 6. Verify Database Setup

Open Prisma Studio to inspect the database:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View seed data
- Manually add/edit records
- Run test queries

---

## Running the Application

### Option 1: Single Terminal (Recommended for Development)

Start both frontend and backend with color-coded output:

```bash
npm run dev:full
```

**Output:**
```
[backend] Server running on http://localhost:8000
[frontend] Vite dev server at http://localhost:3001
```

**Access the application:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000

### Option 2: Separate Terminals

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 3: Persistent tmux Session (Server Environments)

Start a detached tmux session:

```bash
npm run dev:tmux
```

This creates a tmux session named `rowlab-dev` with split panes for backend/frontend.

**Attach to session:**
```bash
tmux attach -t rowlab-dev
```

**Stop the session:**
```bash
npm run stop
```

---

## Verify Installation

### 1. Health Check

Test the backend API:

```bash
curl http://localhost:8000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T12:00:00.000Z",
  "database": "connected",
  "uptime": 15.234
}
```

### 2. Login Test

Test authentication with the seed admin account:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Admin",
      "isAdmin": true
    },
    "teams": [...],
    "activeTeamId": "...",
    "accessToken": "eyJhbGc..."
  }
}
```

### 3. Frontend Access

Open http://localhost:3001 in your browser.

**You should see:**
- Landing page with RowLab branding
- Login/Register links
- Responsive design

**Login with:**
- Username: `admin`
- Password: `admin123`

After login, you'll be redirected to the dashboard.

---

## Optional Integrations

### Concept2 OAuth Setup

1. **Register an application:**
   - Go to https://log.concept2.com/developers/home
   - Create a new application
   - Set redirect URI: `http://localhost:3001/api/v1/concept2/callback`

2. **Add credentials to `.env`:**
   ```bash
   CONCEPT2_CLIENT_ID=your_client_id_here
   CONCEPT2_CLIENT_SECRET=your_client_secret_here
   CONCEPT2_REDIRECT_URI=http://localhost:3001/api/v1/concept2/callback
   CONCEPT2_WEBHOOK_SECRET=your_webhook_secret_here
   ```

3. **Test connection:**
   - Login to RowLab
   - Go to Settings → Integrations
   - Click "Connect Concept2"
   - Authorize the app
   - Verify connection status

### Strava OAuth Setup

1. **Register an application:**
   - Go to https://www.strava.com/settings/api
   - Create a new application
   - Set redirect URI: `http://localhost:3001/api/v1/strava/callback`

2. **Add credentials to `.env`:**
   ```bash
   STRAVA_CLIENT_ID=your_client_id_here
   STRAVA_CLIENT_SECRET=your_client_secret_here
   STRAVA_REDIRECT_URI=http://localhost:3001/api/v1/strava/callback
   ```

3. **Test connection:**
   - Login to RowLab
   - Go to Settings → Integrations
   - Click "Connect Strava"
   - Authorize the app

### Ollama AI Setup (Optional)

For AI-powered lineup optimization:

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama

   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Pull the model:**
   ```bash
   ollama pull phi4-mini-reasoning:3.8b
   ```

4. **Configure in RowLab:**
   - Go to Team Settings → AI Configuration
   - Select model: `phi4-mini-reasoning:3.8b`
   - Save settings

5. **Test:**
   - Go to Lineup Builder
   - Create a lineup
   - Click "AI Suggest" button

---

## Development Workflow

### Daily Development

```bash
# Start development servers
npm run dev:full

# In another terminal, watch for changes
npm run typecheck -- --watch

# Run tests in watch mode
npm test
```

### Database Changes

**1. Modify the schema:**

Edit `prisma/schema.prisma`:

```prisma
model Athlete {
  id        String   @id @default(uuid())
  firstName String
  lastName  String
  email     String?
  newField  String?  // Add new field
  // ...
}
```

**2. Create migration:**

```bash
npx prisma migrate dev --name add_new_field_to_athlete
```

This creates a migration file in `prisma/migrations/`.

**3. Generate Prisma Client:**

```bash
npx prisma generate
```

**4. Update seed script (if needed):**

Edit `prisma/seed.js` to include the new field.

**5. Test migration:**

```bash
npm run db:reset  # WARNING: Deletes all data!
```

### Code Quality

**Run all checks before committing:**

```bash
npm run validate
```

This runs:
- TypeScript type checking
- ESLint linting
- Vitest tests

**Auto-fix issues:**

```bash
npm run lint:fix
npm run format
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | `base64-encoded-string` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `base64-encoded-string` |
| `ENCRYPTION_KEY` | Data encryption key | `64-char-hex-string` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `8000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `STORAGE_LIMIT_BYTES` | Max storage per team | `21474836480` (20GB) |

### OAuth Variables

| Variable | Description |
|----------|-------------|
| `CONCEPT2_CLIENT_ID` | Concept2 OAuth client ID |
| `CONCEPT2_CLIENT_SECRET` | Concept2 OAuth secret |
| `CONCEPT2_REDIRECT_URI` | Concept2 callback URL |
| `CONCEPT2_WEBHOOK_SECRET` | Webhook signature secret |
| `STRAVA_CLIENT_ID` | Strava OAuth client ID |
| `STRAVA_CLIENT_SECRET` | Strava OAuth secret |
| `STRAVA_REDIRECT_URI` | Strava callback URL |

---

## Troubleshooting

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=8001
```

### Database Connection Failed

**Error:**
```
Can't reach database server at localhost:5432
```

**Solutions:**

**Check PostgreSQL is running:**
```bash
# Docker
docker ps | grep postgres

# Local installation
sudo systemctl status postgresql
```

**Verify connection string:**
```bash
psql postgresql://rowlab:rowlab_dev@localhost:5432/rowlab_dev
```

**Check firewall:**
```bash
# Allow port 5432
sudo ufw allow 5432
```

### Prisma Client Not Generated

**Error:**
```
Cannot find module '@prisma/client'
```

**Solution:**
```bash
npx prisma generate
```

### OAuth Redirect Mismatch

**Error:**
```
redirect_uri_mismatch
```

**Solution:**

Ensure the redirect URI in `.env` matches exactly what's configured in:
- Concept2 developer portal
- Strava API settings

**Development URI must be:**
- Concept2: `http://localhost:3001/api/v1/concept2/callback`
- Strava: `http://localhost:3001/api/v1/strava/callback`

### CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:8000/api/...' blocked by CORS
```

**Solution:**

Check Vite proxy configuration in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### Tests Failing After Database Changes

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

## Common Development Tasks

### Create a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Add backend route
# Edit server/routes/myFeature.js

# 3. Add frontend route
# Edit src/v2/routes/app/my-feature.tsx

# 4. Update database schema (if needed)
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_my_feature

# 5. Run tests
npm run validate

# 6. Commit changes
git add .
git commit -m "feat: add my feature"

# 7. Push branch
git push -u origin feature/my-feature
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update a specific package
npm update <package-name>

# Update all packages
npm update

# Reinstall from scratch
rm -rf node_modules package-lock.json
npm install
```

### Database Operations

```bash
# View database in GUI
npm run db:studio

# Create migration
npx prisma migrate dev --name <migration-name>

# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed database
npm run db:seed

# View migration history
npx prisma migrate status
```

---

## IDE Setup

### VS Code (Recommended)

**Recommended Extensions:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**Settings:**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### WebStorm/IntelliJ IDEA

**Enable ESLint:**
- Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- Check "Automatic ESLint configuration"

**Enable Prettier:**
- Settings → Languages & Frameworks → JavaScript → Prettier
- Check "On save"

---

## Next Steps

After successful setup:

1. **Read the documentation:**
   - [Architecture Overview](./architecture.md)
   - [API Reference](./api.md)
   - [Database Schema](./DATABASE_SCHEMA.md)

2. **Explore the codebase:**
   - Frontend: `src/v2/`
   - Backend: `server/`
   - Database: `prisma/schema.prisma`

3. **Join development:**
   - Check issues: https://github.com/samwduncan/RowLab/issues
   - Review PRs: https://github.com/samwduncan/RowLab/pulls
   - Read CONTRIBUTING.md

---

**Last Updated:** 2026-02-14
**Setup Guide Version:** 1.0
