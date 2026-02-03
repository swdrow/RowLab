<p align="center">
  <img src="public/images/logo.svg" alt="RowLab Logo" width="100" height="100">
</p>

<h1 align="center">RowLab</h1>

<p align="center">
  <strong>Data-Driven Lineup Optimization for Competitive Rowing</strong>
  <br>
  <em>Modern SaaS platform for coaches who demand precision</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/react-18-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/build-passing-success.svg" alt="Build">
  <img src="https://img.shields.io/badge/coverage-70%25-yellow.svg" alt="Coverage">
</p>

---

## Overview

**RowLab** transforms how rowing coaches build boat lineups and analyze team performance. Stop relying on spreadsheets, gut feelings, and institutional knowledge that walks out the door. Start making data-driven decisions with AI-powered recommendations, statistical seat racing analysis, and comprehensive performance tracking.

### The Problem

Rowing coaches face constant challenges:

- **Institutional knowledge** disappears when coaches leave
- **Erg scores** don't predict on-water performance
- **Gut-feel decisions** instead of data-driven insights
- **Spreadsheets** can't capture complex athlete relationships
- **No objective way** to compare athletes across boats

### The Solution

RowLab is the only platform that combines:

- **Modern drag-and-drop lineup builder** with real-time collaboration
- **AI-powered optimization** using genetic algorithms (unique in market)
- **Statistical seat racing** with Elo rankings and regression models
- **Unified integrations** (Concept2, Strava, Garmin, telemetry devices)
- **Training plan management** with periodization and load tracking
- **Race day tools** with live timing and standings

---

## Screenshots

<details>
<summary><b>🎨 View Screenshots</b> (click to expand)</summary>

### Lineup Builder
![Lineup Builder](docs/images/lineup-builder.png)
*Drag-and-drop interface for creating optimal boat lineups*

### Performance Dashboard
![Dashboard](docs/images/dashboard.png)
*Track erg scores, seat racing results, and training metrics*

### Race Day View
![Race Day](docs/images/race-day.png)
*Live timing, countdown timers, and standings calculation*

### Training Plans
![Training Plans](docs/images/training-plans.png)
*Plan builder with periodization templates and load tracking*

</details>

---

## Features

### 🚣 Team Management

- **Multi-tenant architecture** - Manage multiple teams with role-based access
- **Athlete profiles** - Track personal bests, side preferences, injury history
- **Fleet management** - Organize shells by type, condition, and availability
- **User roles** - Admin, coach, athlete with granular permissions

### 📊 Erg Data Tracking

- **Comprehensive test tracking** - 2k, 6k, 500m, 30-minute tests
- **Trend visualization** - Charts showing performance over time
- **Concept2 integration** - OAuth sync with Concept2 Logbook for automatic import
- **Custom workouts** - Record any workout type with split data
- **Export capabilities** - PDF reports and CSV data exports

### 🔄 Integration Hub

| Integration | Status | Features |
|------------|--------|----------|
| **Concept2** | ✅ Live | OAuth sync, automatic workout import, background sync every 6h |
| **Strava** | ✅ Live | Activity sync, workout upload from Concept2, background sync every 4h |
| **Garmin** | ✅ Live | .FIT file import, multi-file upload support |
| **Telemetry** | ✅ Live | Empower, Peach, NK sensor data import |

### 🧬 AI-Powered Optimization

- **Genetic algorithm** - Optimize lineups across multiple constraints
- **Side balancing** - Ensure proper port/starboard distribution
- **Speed prediction** - Estimate boat speed based on athlete combinations
- **Constraint handling** - Respect athlete preferences and physical limitations
- **Local LLM** - Privacy-preserving AI with Ollama integration
- **Combined scoring** - Unified rankings from erg data, seat racing, and telemetry

### 📈 Seat Racing & Analytics

- **Elo rating system** - Chess-inspired rankings adapted for rowing
- **Piece recording** - Log multiple boats in head-to-head racing sessions
- **Margin analysis** - Statistical models accounting for conditions
- **Historical tracking** - View rating changes across the season
- **Regression analysis** - True speed differences with confidence intervals
- **Visual comparisons** - Charts showing athlete progression

### 📅 Training Plans

- **Plan builder calendar** - Drag-and-drop workout scheduling
- **Workout library** - Pre-built templates for common sessions
- **Athlete assignments** - Assign workouts to individuals or groups
- **Load tracking** - TSS (Training Stress Score) calculation and visualization
- **Periodization templates** - Base, build, peak, taper phases
- **Compliance monitoring** - Track completion rates and adherence

### 🏁 Race Day Tools

- **Race schedule** - Timeline view with countdown timers
- **Live results** - Real-time race entry and margin calculation
- **Standings calculation** - Automatic point totals and rankings
- **Team highlighting** - Filter to view only your team's races
- **Margin prediction** - Estimate outcomes based on training data

### 🤝 Real-Time Collaboration

- **Multi-user editing** - Multiple coaches editing lineups simultaneously
- **Presence indicators** - See who's viewing/editing in real-time
- **Avatar stack** - Visual representation of active collaborators
- **WebSocket sync** - Instant updates across all connected clients
- **Change history** - Audit log of all lineup modifications

---

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/) or use Docker)
- **Git** ([Download](https://git-scm.com/downloads))
- **Ollama** (optional, for AI features) ([Download](https://ollama.ai/))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/swdrow/RowLab.git
cd RowLab
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rowlab

# Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Server
PORT=8000
CLIENT_URL=http://localhost:3001

# AI (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Integrations (optional)
CONCEPT2_CLIENT_ID=your-client-id
CONCEPT2_CLIENT_SECRET=your-client-secret
STRAVA_CLIENT_ID=your-client-id
STRAVA_CLIENT_SECRET=your-client-secret
```

4. **Set up the database**

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed with sample data (optional)
npm run db:seed
```

5. **Start the development servers**

```bash
# Start both frontend and backend
npm run dev:full

# Or use tmux for persistent sessions
npm run dev:tmux
```

6. **Open the application**

Visit [http://localhost:3001](http://localhost:3001) in your browser.

### Docker Deployment

For production or testing with Docker:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access the application at [http://localhost:3001](http://localhost:3001).

See [docs/self-hosted-setup.md](docs/self-hosted-setup.md) for detailed deployment instructions.

---

## Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| [React](https://react.dev/) | UI framework with hooks and concurrent rendering | 18.2 |
| [Vite](https://vitejs.dev/) | Fast build tool with HMR | 5.0 |
| [TailwindCSS](https://tailwindcss.com/) | Utility-first CSS framework | 3.4 |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management | 4.4 |
| [@dnd-kit](https://dndkit.com/) | Accessible drag-and-drop toolkit | 6.1 |
| [Framer Motion](https://www.framer.com/motion/) | Animation library | 11.18 |
| [Recharts](https://recharts.org/) | Composable charting library | 2.10 |
| [Three.js](https://threejs.org/) | 3D graphics (boat visualization) | 0.160 |
| [React Router](https://reactrouter.com/) | Client-side routing | 6.30 |
| [Socket.io Client](https://socket.io/) | Real-time WebSocket communication | 4.8 |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| [Express.js](https://expressjs.com/) | Web framework for Node.js | 4.18 |
| [PostgreSQL](https://www.postgresql.org/) | Relational database | 14+ |
| [Prisma](https://www.prisma.io/) | Next-gen ORM with type safety | 7.2 |
| [JWT](https://jwt.io/) | Token-based authentication | 9.0 |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing | 3.0 |
| [Helmet](https://helmetjs.github.io/) | Security headers middleware | 8.1 |
| [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit) | Rate limiting | 8.2 |
| [Socket.io](https://socket.io/) | Real-time WebSocket server | 4.8 |
| [Winston](https://github.com/winstonjs/winston) | Logging library | 3.19 |
| [Node-cron](https://github.com/node-cron/node-cron) | Scheduled jobs for background sync | 4.2 |

### Testing & Quality

| Technology | Purpose | Version |
|------------|---------|---------|
| [Vitest](https://vitest.dev/) | Unit testing framework | 4.0 |
| [Testing Library](https://testing-library.com/) | React component testing | 16.3 |
| [ESLint](https://eslint.org/) | JavaScript/TypeScript linting | 9.39 |
| [Prettier](https://prettier.io/) | Code formatting | 3.7 |
| [TypeScript](https://www.typescriptlang.org/) | Type checking | 5.9 |

### External APIs

- **Concept2 API** - OAuth integration for logbook sync
- **Strava API** - Activity sync and workout uploads
- **Ollama** - Local LLM for AI recommendations
- **Stripe** - Subscription billing (planned)

---

## Configuration

### Required Environment Variables

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (generate secure random strings)
JWT_SECRET=<your-secret-key>
JWT_REFRESH_SECRET=<your-refresh-secret>

# Server Configuration
PORT=8000
CLIENT_URL=http://localhost:3001
NODE_ENV=development
```

### Optional Environment Variables

```env
# AI Features (requires Ollama running)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Concept2 Integration
CONCEPT2_CLIENT_ID=<from-concept2-developers>
CONCEPT2_CLIENT_SECRET=<from-concept2-developers>
CONCEPT2_REDIRECT_URI=http://localhost:8000/api/integrations/concept2/callback

# Strava Integration
STRAVA_CLIENT_ID=<from-strava-api>
STRAVA_CLIENT_SECRET=<from-strava-api>
STRAVA_REDIRECT_URI=http://localhost:8000/api/integrations/strava/callback

# Stripe Billing (production)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Generating Secrets

```bash
# Generate secure random secrets for JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start frontend only (Vite)
npm run server       # Start backend only (Express)
npm run dev:full     # Start both servers concurrently
npm run dev:tmux     # Start in tmux for persistent sessions
npm stop             # Stop all development servers

# Database
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database and re-seed
npm run db:studio    # Open Prisma Studio (GUI)

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
npm run test:ui      # Open Vitest UI

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable linting issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run typecheck    # Run TypeScript type checking
npm run validate     # Run typecheck + lint + test

# Production
npm run build        # Build for production
npm start            # Run production server
npm run preview      # Preview production build
```

### Project Structure

```
RowLab/
├── src/                        # React frontend source
│   ├── components/             # React components
│   │   ├── ui/                # Base design system components
│   │   │   ├── GlassButton.jsx
│   │   │   ├── GlassModal.jsx
│   │   │   └── SpotlightCard.jsx
│   │   ├── domain/            # Domain-specific components
│   │   │   ├── LineupBoard.jsx
│   │   │   ├── AthleteBank.jsx
│   │   │   └── BoatDisplay.jsx
│   │   └── compound/          # Composite components
│   │       ├── PerformanceModal.jsx
│   │       └── ErgDataModal.jsx
│   ├── pages/                 # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── LineupPage.jsx
│   │   ├── AthletesPage.jsx
│   │   └── TrainingPlansPage.jsx
│   ├── store/                 # Zustand state stores
│   │   ├── useAthleteStore.js
│   │   ├── useLineupStore.js
│   │   └── useAuthStore.js
│   ├── theme/                 # Design tokens and themes
│   │   ├── colors.js
│   │   ├── glassMorphism.js
│   │   └── precisionInstrument.js
│   ├── services/              # API client services
│   │   ├── api.js
│   │   └── auth.js
│   ├── utils/                 # Utility functions
│   │   ├── calculations.js
│   │   └── validators.js
│   ├── App.jsx               # Root component
│   └── main.jsx              # Entry point
├── server/                     # Express backend
│   ├── routes/                # API route handlers
│   │   ├── auth.js
│   │   ├── athletes.js
│   │   ├── lineups.js
│   │   ├── erg-data.js
│   │   ├── seat-racing.js
│   │   ├── training-plans.js
│   │   └── integrations/
│   │       ├── concept2.js
│   │       └── strava.js
│   ├── services/              # Business logic services
│   │   ├── athleteService.js
│   │   ├── lineupService.js
│   │   ├── ergDataService.js
│   │   ├── seatRacingService.js
│   │   ├── aiService.js
│   │   ├── trainingPlanService.js
│   │   └── integrations/
│   │       ├── concept2Service.js
│   │       └── stravaService.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── validator.js
│   │   └── errorHandler.js
│   ├── socket/                # WebSocket handlers
│   │   └── collaboration.js
│   ├── jobs/                  # Background jobs
│   │   └── syncJobs.js
│   ├── utils/                 # Server utilities
│   │   ├── logger.js
│   │   └── encryption.js
│   └── index.js              # Server entry point
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/            # Migration history
│   └── seed.js               # Database seeding script
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   │   ├── README.md
│   │   ├── auth.md
│   │   └── endpoints.md
│   ├── database/              # Database documentation
│   │   ├── README.md
│   │   └── schema.md
│   ├── components/            # Component documentation
│   │   └── README.md
│   ├── services/              # Service documentation
│   │   └── README.md
│   └── self-hosted-setup.md  # Deployment guide
├── public/                     # Static assets
│   └── images/
│       └── logo.svg
├── scripts/                    # Utility scripts
│   ├── dev.sh                # tmux dev environment
│   └── stop-dev.sh           # Stop dev servers
├── tests/                      # Test files (mirrors src/)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Docker configuration
├── package.json               # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── vitest.config.js          # Vitest configuration
├── CONTRIBUTING.md           # Contribution guidelines
├── LICENSE                   # MIT License
└── README.md                 # This file
```

### Design System: Precision Instrument

RowLab uses a custom design system inspired by Linear and Raycast:

- **Void-deep backgrounds** (`#08080A`) - Focused, distraction-free interfaces
- **Blade blue accent** (`#0070F3`) - Primary actions and highlights
- **Port/Starboard semantics** - Red (port) and green (starboard) following maritime conventions
- **Glass morphism** - Subtle backdrop blur with transparency
- **Spotlight hover effects** - Interactive feedback on buttons and cards
- **High contrast text** - WCAG 2.1 AA compliant

Design tokens are defined in `src/theme/precisionInstrument.js`.

### Writing Tests

RowLab uses Vitest and Testing Library. Place tests adjacent to source files:

```
src/
├── components/
│   ├── AthleteCard.jsx
│   └── AthleteCard.test.jsx  # Component test
└── services/
    ├── athleteService.js
    └── athleteService.test.js  # Service test
```

Example component test:

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AthleteCard from './AthleteCard';

describe('AthleteCard', () => {
  it('renders athlete name', () => {
    const athlete = { id: 1, name: 'John Smith' };
    render(<AthleteCard athlete={athlete} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });
});
```

Run tests with `npm run test`.

### Code Style

- **ESLint** enforces consistent code style
- **Prettier** formats code automatically
- **TypeScript** (gradual migration) for type safety
- Follow React best practices (hooks, functional components)
- Use JSDoc comments for documentation

---

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or reporting issues, your help makes RowLab better.

### Ways to Contribute

- **🐛 Bug Reports** - Found a bug? [Open an issue](https://github.com/swdrow/RowLab/issues/new) with reproduction steps
- **💡 Feature Requests** - Have an idea? [Start a discussion](https://github.com/swdrow/RowLab/discussions/new)
- **🔧 Code Contributions** - Submit a pull request following our guidelines
- **📖 Documentation** - Improve docs, add examples, fix typos
- **🧪 Testing** - Write tests to improve coverage
- **🎨 Design** - Suggest UI/UX improvements

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/RowLab.git
   cd RowLab
   ```
3. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our code style
5. **Run tests** to ensure everything works
   ```bash
   npm run validate
   ```
6. **Commit your changes** with clear messages
   ```bash
   git commit -m "Add: description of your feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** on GitHub

### Contribution Guidelines

- **Code Quality**: Run `npm run validate` before submitting
- **Tests**: Add tests for new features
- **Documentation**: Update docs for API changes
- **Commit Messages**: Use clear, descriptive messages
  - `Add:` for new features
  - `Fix:` for bug fixes
  - `Update:` for improvements
  - `Docs:` for documentation
- **Issue References**: Link to related issues in PR description

### Good First Issues

Look for issues labeled:
- [`good first issue`](https://github.com/swdrow/RowLab/labels/good%20first%20issue) - Beginner friendly
- [`help wanted`](https://github.com/swdrow/RowLab/labels/help%20wanted) - Community input needed
- [`documentation`](https://github.com/swdrow/RowLab/labels/documentation) - Docs improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Roadmap

RowLab is actively developed across milestone releases. Here's where we are and where we're headed.

### v1.0 — Full UX Redesign ✅

Ground-up rebuild with multi-persona Workspace/Context architecture.

- [x] V2 foundation with design tokens and CSS isolation
- [x] Application shell with context-aware navigation (Me/Coach/Admin)
- [x] Personal dashboard with Concept2 and Strava integration
- [x] Coach features migration (whiteboard, fleet, availability)
- [x] V2 default at `/app`, V1 fallback at `/legacy`

### v2.0 — Core Migration ✅

Complete V1-to-V2 feature migration with "Precision Instrument" design philosophy.

- [x] Athletes and roster management with bulk CSV import
- [x] Erg data tracking with trend charts and Concept2 sync
- [x] Drag-and-drop lineup builder with undo/redo and PDF export
- [x] Seat racing with Elo rankings and confidence intervals
- [x] Training plans with periodization and NCAA 20-hour compliance
- [x] Racing and regattas with race day command center
- [x] Settings, photo uploads, and design polish (WCAG 2.1 AA)
- [x] Cross-feature integrations (global search, live erg, unified activity feed)
- [x] Advanced seat racing analytics (Bradley-Terry model, matrix planner, passive Elo)

### v2.1 — Feature Expansion (In Progress)

Feature toggles, gamification, design overhaul, and lineup improvements.

- [x] Feature toggles and recruit visit management
- [x] Gamification (achievements, PRs, team challenges, streaks)
- [x] Lineup and boat configuration improvements (rigging, templates, comparison)
- [ ] Complete design overhaul (warm color system, tactile interactions, mobile responsive)
- [ ] Warm color design system and landing page rebuild

### v2.2 — Advanced Analytics (Planned)

Telemetry, AI optimization, predictive modeling, and mobile coxswain experience.

- [ ] Telemetry import (Empower, Peach, NK SpeedCoach) with force curve visualization
- [ ] AI lineup optimizer v2 with constraint configuration and explanation system
- [ ] Predictive analytics (2k predictions, injury risk, progress projections)
- [ ] Coxswain mobile view with offline support and piece timer

### Feature Comparison

| Feature | RowLab | RegattaCentral | CrewLAB | iCrew |
|---------|--------|----------------|---------|-------|
| Modern UI | ✅ | ❌ | ⚠️ | ❌ |
| AI Lineup Optimization | ✅ | ❌ | ❌ | ❌ |
| Seat Racing Analytics | ✅ | ❌ | ⚠️ | ❌ |
| Real-Time Collaboration | ✅ | ❌ | ❌ | ❌ |
| Concept2 Integration | ✅ | ❌ | ❌ | ❌ |
| Training Plans + NCAA | ✅ | ❌ | ❌ | ❌ |
| Gamification | ✅ | ❌ | ❌ | ❌ |
| Telemetry Import | 🚧 Planned | ❌ | ✅ | ❌ |
| Coxswain Mobile | 🚧 Planned | ❌ | ⚠️ | ❌ |
| Self-Hosted | ✅ | ❌ | ❌ | ❌ |

**RowLab is the only platform with AI-powered lineup optimization, Bradley-Terry seat racing analytics, and modern real-time collaboration.**

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

| Document | Description |
|----------|-------------|
| [API Reference](docs/api/README.md) | Complete REST API documentation with examples |
| [Database Schema](docs/database/README.md) | Prisma models, relationships, and migrations |
| [Component Guide](docs/components/README.md) | React component documentation and usage |
| [Services Guide](docs/services/README.md) | Backend service layer documentation |
| [Self-Hosted Setup](docs/self-hosted-setup.md) | Production deployment instructions |
| Design System | Precision Instrument aesthetic (see Design System section below) |

---

## Community & Support

### Get Help

- **Documentation** - Check [docs/](docs/) for guides and references
- **GitHub Issues** - [Search existing issues](https://github.com/swdrow/RowLab/issues) or open a new one
- **GitHub Discussions** - [Ask questions and share ideas](https://github.com/swdrow/RowLab/discussions)

### Stay Updated

- **Star this repository** to get updates
- **Watch releases** for new versions
- **Follow the roadmap** in the [Roadmap section](#roadmap) above

---

## License

RowLab is open source software licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2026 RowLab Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

RowLab is built with excellent open source tools and inspired by great products:

- **[Concept2](https://www.concept2.com/)** - For providing the erg data API
- **[Ollama](https://ollama.ai/)** - For local LLM inference
- **[@dnd-kit](https://dndkit.com/)** - For accessible drag-and-drop
- **[Prisma](https://www.prisma.io/)** - For the excellent ORM
- **[Linear](https://linear.app/)** - Design inspiration for the Precision Instrument aesthetic
- **[Raycast](https://www.raycast.com/)** - Command palette and UI patterns
- **[Cal.com](https://cal.com/)** - Open source SaaS reference

Special thanks to all [contributors](https://github.com/swdrow/RowLab/graphs/contributors) who help make RowLab better.

---

## Target Audience

RowLab is designed for competitive rowing programs:

- **Collegiate Programs** - 250+ NCAA/ACRA programs nationally
- **Club Teams** - 2,000+ competitive club programs
- **High School** - Growing varsity programs
- **Masters** - Competitive adult rowing clubs
- **National Teams** - Elite-level training programs

### Why Coaches Choose RowLab

| Traditional Approach | RowLab |
|---------------------|--------|
| Spreadsheets and paper | Modern drag-and-drop interface |
| Gut-feel decisions | Data-driven AI recommendations |
| Lost knowledge when coaches leave | Persistent, searchable history |
| No objective athlete comparisons | Elo-based seat racing rankings |
| Manual data entry | Concept2 sync, telemetry import |
| Static lineups | Real-time collaborative editing |

---

<p align="center">
  <strong>RowLab</strong> — Built for coaches who demand precision
</p>

<p align="center">
  <a href="https://github.com/swdrow/RowLab">⭐ Star on GitHub</a> •
  <a href="https://github.com/swdrow/RowLab/issues/new">🐛 Report Bug</a> •
  <a href="https://github.com/swdrow/RowLab/discussions/new">💡 Request Feature</a>
</p>

<p align="center">
  <sub>Made with ❤️ by the RowLab community</sub>
</p>
