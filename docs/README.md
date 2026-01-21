# RowLab Technical Documentation

Welcome to the comprehensive technical documentation for RowLab, a multi-tenant rowing team management platform built with React, Express, and PostgreSQL.

## Documentation Overview

This documentation is organized into the following sections:

### 1. [API Documentation](./api/README.md)
Complete REST API reference covering all endpoints, request/response formats, authentication, and error handling.

- [Authentication & Authorization](./api/authentication.md)
- [Athletes API](./api/athletes.md)
- [Erg Tests API](./api/erg-tests.md)
- [Lineups API](./api/lineups.md)
- [Seat Racing API](./api/seat-racing.md)
- [Regattas & Racing API](./api/racing.md)
- [Teams & Invitations](./api/teams.md)
- [Subscriptions & Billing](./api/subscriptions.md)

### 2. [Database Schema](./database/README.md)
PostgreSQL database schema documentation with Prisma ORM.

- [Core Models](./database/core-models.md) - Users, Teams, TeamMembers
- [Athlete Models](./database/athlete-models.md) - Athletes, Concept2 integration
- [Performance Models](./database/performance-models.md) - ErgTests, Workouts, Telemetry
- [Lineup Models](./database/lineup-models.md) - Lineups, Shells, BoatConfigs
- [Racing Models](./database/racing-models.md) - Regattas, Races, Results
- [Seat Racing Models](./database/seat-racing-models.md) - Sessions, Pieces, Boats, ELO ratings
- [Migration History](./database/migrations.md)

### 3. [Services Documentation](./services/README.md)
Backend business logic and service layer architecture.

- [Authentication Service](./services/auth-service.md)
- [Athlete Service](./services/athlete-service.md)
- [Erg Test Service](./services/erg-test-service.md)
- [Lineup Service](./services/lineup-service.md)
- [ELO Rating Service](./services/elo-rating-service.md)
- [Margin Calculation Service](./services/margin-calculation-service.md)
- [AI Services](./services/ai-services.md)

### 4. [Component Documentation](./components/README.md)
React component library and frontend architecture.

- [Design System](./components/design-system.md)
- [Athlete Components](./components/athletes.md)
- [Lineup Components](./components/lineups.md)
- [Performance Components](./components/performance.md)
- [State Management](./components/state-management.md)

### 5. [Architecture & Patterns](./architecture/README.md)
High-level system architecture and design patterns.

- [System Architecture](./architecture/system.md)
- [Multi-Tenancy](./architecture/multi-tenancy.md)
- [Authentication Flow](./architecture/authentication.md)
- [Security](./architecture/security.md)
- [Performance Optimization](./architecture/performance.md)

## Quick Start for Developers

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd RowLab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# In another terminal, start the backend
npm run server
```

### Project Structure

```
RowLab/
├── server/                 # Backend Express server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic layer
│   ├── middleware/        # Express middleware
│   └── db/                # Database connection
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state management
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema definition
│   └── migrations/       # Database migrations
├── docs/                 # This documentation
└── public/              # Static assets
```

## Key Concepts

### Multi-Tenant Architecture
RowLab uses a team-based multi-tenancy model where:
- Users can belong to multiple teams
- All data is isolated by team
- API requests require an active team context
- JWT tokens include team membership information

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials and generates JWT access token + refresh token
3. Access token includes user ID, active team ID, and role
4. Refresh token stored as HTTP-only cookie for token rotation
5. All API requests require valid access token in Authorization header

### Role-Based Access Control (RBAC)
Three roles per team:
- **OWNER**: Full administrative access
- **COACH**: Can manage athletes, lineups, and data
- **ATHLETE**: Read-only access to own data

### Data Models

#### Core Entities
- **User**: Platform account (email, password, name)
- **Team**: Organization/rowing team
- **TeamMember**: Join table linking users to teams with roles
- **Athlete**: Individual rower (may or may not have user account)

#### Performance Data
- **ErgTest**: Recorded erg test results (2k, 6k, etc.)
- **Workout**: Training session data (can sync from Concept2)
- **AthleteTelemetry**: Oarlock sensor data (power, angles, technique)

#### Lineup Management
- **Lineup**: Named boat configuration
- **LineupAssignment**: Athlete seat assignments within a lineup
- **Shell**: Physical boat inventory
- **BoatConfig**: Template boat configurations (8+, 4-, etc.)

#### Racing & Selection
- **SeatRaceSession**: Seat racing event with multiple pieces
- **SeatRacePiece**: Individual race within a session
- **SeatRaceBoat**: Boat configuration for a piece
- **AthleteRating**: ELO-based rating system for athlete rankings
- **Regatta**: Racing event
- **Race**: Individual race within a regatta
- **RaceResult**: Race finish times and placements

## API Standards

### Request Format
```http
GET /api/v1/athletes
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Format
All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    "athletes": [...],
    "count": 10
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Athlete not found"
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `DUPLICATE`: Resource already exists
- `FORBIDDEN`: Insufficient permissions
- `UNAUTHORIZED`: Authentication required
- `NO_TOKEN`: Missing access token
- `INVALID_TOKEN`: Expired or invalid token
- `SERVER_ERROR`: Internal server error

## Development Workflow

### Adding a New Feature

1. **Database Schema**: Update `prisma/schema.prisma`
2. **Migration**: Run `npx prisma migrate dev --name feature_name`
3. **Service Layer**: Create/update service in `server/services/`
4. **API Routes**: Add route handlers in `server/routes/`
5. **Frontend Store**: Add Zustand store in `src/store/`
6. **Components**: Create React components in `src/components/`
7. **Documentation**: Update relevant docs

### Testing

```bash
# Run backend tests
npm run test:server

# Run frontend tests
npm run test

# Run E2E tests
npm run test:e2e
```

### Code Style
- ESLint configuration in `.eslintrc.json`
- Prettier for code formatting
- Follow existing patterns and conventions

## Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm run server
```

### Environment Variables
See `.env.example` for required configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3002)

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Update tests and documentation
4. Submit a pull request with clear description

## Support & Resources

- [GitHub Issues](https://github.com/yourusername/rowlab/issues)
- [API Changelog](./CHANGELOG.md)
- [Migration Guide](./MIGRATION.md)

## License

[Your License Here]

---

**Last Updated**: 2026-01-19
**Version**: 2.0.0
